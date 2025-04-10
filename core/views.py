from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, authenticate, logout
from django.contrib import messages
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.http import require_POST
from django.db.models import Q
from django.utils import timezone
import json

from .models import UserProfile, Contact, Message, MessageKey
from .forms import UserRegistrationForm, UserLoginForm, CalculatorPasswordForm, ContactForm, MessageForm
from .encryption import generate_key_pair, encrypt_message, decrypt_message

from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt

@ensure_csrf_cookie
def calculator_view(request):
    """
    Display the calculator interface which serves as the front for the messaging app
    """
    return render(request, 'core/calculator.html')

@ensure_csrf_cookie
def verify_calculator_password(request):
    """
    Verify the entered calculator password and redirect to messaging if correct
    """
    if request.method == 'POST':
        entered_password = request.POST.get('calculator_password')
        
        if request.user.is_authenticated:
            try:
                profile = request.user.profile
                if profile.calculator_password == entered_password:
                    request.session['calculator_verified'] = True
                    return redirect('messages_view')
            except UserProfile.DoesNotExist:
                pass
                
        return redirect('calculator_view')
    
    return redirect('calculator_view')

def register_view(request):
    """
    User registration view
    """
    if request.user.is_authenticated:
        return redirect('calculator_view')
        
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        calculator_password_form = CalculatorPasswordForm(request.POST)
        
        if form.is_valid() and calculator_password_form.is_valid():
            user = form.save()
            
            # Create user profile with calculator password
            profile = UserProfile.objects.create(
                user=user,
                calculator_password=calculator_password_form.cleaned_data['calculator_password']
            )
            
            # Generate encryption keys
            public_key, private_key = generate_key_pair()
            
            # Only save the public key to the database
            MessageKey.objects.create(
                user=user,
                public_key=public_key
            )
            
            # Save private key to session (temporarily for this request only)
            # It will be transferred to client-side localStorage in the template
            request.session['temp_private_key'] = private_key
            
            # Auto-login after registration
            login(request, user)
            messages.success(request, 'Registration successful. You are now logged in.')
            return redirect('calculator_view')
    else:
        form = UserRegistrationForm()
        calculator_password_form = CalculatorPasswordForm()
    
    return render(request, 'core/register.html', {
        'form': form,
        'calculator_password_form': calculator_password_form
    })

def login_view(request):
    """
    User login view
    """
    if request.user.is_authenticated:
        return redirect('calculator_view')
        
    if request.method == 'POST':
        form = UserLoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(username=username, password=password)
            
            if user:
                login(request, user)
                messages.success(request, 'You have successfully logged in.')
                return redirect('calculator_view')
            else:
                messages.error(request, 'Invalid username or password.')
    else:
        form = UserLoginForm()
    
    return render(request, 'core/login.html', {'form': form})

def logout_view(request):
    """
    User logout view
    """
    logout(request)
    if 'calculator_verified' in request.session:
        del request.session['calculator_verified']
    return redirect('calculator_view')

@login_required
def messages_view(request):
    """
    Main messaging interface
    """
    # Check if user is verified through calculator
    if not request.session.get('calculator_verified', False):
        return redirect('calculator_view')
    
    # Get user's contacts
    contacts = Contact.objects.filter(owner=request.user).select_related('contact_user')
    
    # Get selected contact if any
    selected_contact_id = request.GET.get('contact')
    selected_contact = None
    selected_contact_obj = None  # The Contact object (not User) for security verification
    messages_list = []
    
    if selected_contact_id:
        try:
            selected_contact = User.objects.get(id=selected_contact_id)
            
            # Check if this is a valid contact and get the Contact object
            contact_obj = Contact.objects.filter(owner=request.user, contact_user=selected_contact).first()
            if not contact_obj:
                selected_contact = None
            else:
                selected_contact_obj = contact_obj
                
                # Get messages between users
                messages_list = Message.objects.filter(
                    (Q(sender=request.user) & Q(receiver=selected_contact)) | 
                    (Q(sender=selected_contact) & Q(receiver=request.user))
                ).order_by('sent_on')
                
                # Mark unread messages as read
                Message.objects.filter(
                    sender=selected_contact,
                    receiver=request.user,
                    is_read=False
                ).update(is_read=True)
        except User.DoesNotExist:
            pass
    
    return render(request, 'core/messages.html', {
        'contacts': contacts,
        'selected_contact': selected_contact,
        'selected_contact_obj': selected_contact_obj,  # Pass the Contact object for security verification
        'messages': messages_list,
        'form': MessageForm() if selected_contact else None
    })

@login_required
def contacts_view(request):
    """
    Contact management view
    """
    # Check if user is verified through calculator
    if not request.session.get('calculator_verified', False):
        return redirect('calculator_view')
    
    contacts = Contact.objects.filter(owner=request.user).select_related('contact_user')
    
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            
            try:
                contact_user = User.objects.get(username=username)
                
                # Don't allow adding yourself
                if contact_user == request.user:
                    messages.error(request, "You cannot add yourself as a contact.")
                    return redirect('contacts_view')
                
                # Check if contact already exists
                contact_exists = Contact.objects.filter(owner=request.user, contact_user=contact_user).exists()
                if contact_exists:
                    messages.error(request, f"{username} is already in your contacts.")
                    return redirect('contacts_view')
                
                # Create new contact
                Contact.objects.create(owner=request.user, contact_user=contact_user)
                messages.success(request, f"{username} has been added to your contacts.")
                return redirect('contacts_view')
            except User.DoesNotExist:
                messages.error(request, f"User {username} does not exist.")
    else:
        form = ContactForm()
    
    return render(request, 'core/contacts.html', {
        'contacts': contacts,
        'form': form
    })

@login_required
@require_POST
def delete_contact(request, contact_id):
    """
    Delete a contact
    """
    # Check if user is verified through calculator
    if not request.session.get('calculator_verified', False):
        return HttpResponseForbidden()
    
    contact = get_object_or_404(Contact, id=contact_id, owner=request.user)
    contact.delete()
    
    messages.success(request, "Contact has been removed.")
    return redirect('contacts_view')

@login_required
@require_POST
def send_message(request):
    """
    Send a new encrypted message
    """
    # Check if user is verified through calculator
    if not request.session.get('calculator_verified', False):
        return HttpResponseForbidden()
    
    if request.method == 'POST':
        form = MessageForm(request.POST)
        if form.is_valid():
            receiver_id = form.cleaned_data['receiver_id']
            content = form.cleaned_data['content']
            
            try:
                receiver = User.objects.get(id=receiver_id)
                
                # Check if this is a valid contact
                is_contact = Contact.objects.filter(owner=request.user, contact_user=receiver).exists()
                if not is_contact:
                    return JsonResponse({'status': 'error', 'message': 'Invalid contact'})
                
                # Get receiver's public key
                try:
                    receiver_key = MessageKey.objects.get(user=receiver)
                    # Encrypt the message with receiver's public key
                    encrypted_content = encrypt_message(content, receiver_key.public_key)
                    
                    # Save the encrypted message
                    message = Message.objects.create(
                        sender=request.user,
                        receiver=receiver,
                        content=encrypted_content,
                        is_read=False
                    )
                    
                    # IMPROVEMENT: For better user experience, also save a special copy for self
                    # Get our own public key
                    try:
                        own_key = MessageKey.objects.get(user=request.user)
                        # Encrypt with our own public key so we can decrypt it later
                        self_encrypted = encrypt_message(content, own_key.public_key)
                        
                        # Save a special "sent to self" message that we can decrypt later
                        Message.objects.create(
                            sender=receiver,  # Trick: mark it as if it came from receiver
                            receiver=request.user,  # To self
                            content=self_encrypted,
                            is_read=True,  # Already read
                            sent_on=message.sent_on  # Same timestamp to match
                        )
                    except MessageKey.DoesNotExist:
                        # Not critical if this fails, user will still see encrypted message
                        pass
                    
                    return JsonResponse({
                        'status': 'success',
                        'message_id': message.id,
                        'sent_on': message.sent_on.strftime('%Y-%m-%d %H:%M:%S')
                    })
                except MessageKey.DoesNotExist:
                    return JsonResponse({'status': 'error', 'message': 'Receiver has no encryption key'})
                
            except User.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': 'User does not exist'})
    
    return JsonResponse({'status': 'error', 'message': 'Invalid form data'})

@login_required
def get_messages(request, contact_id):
    """
    API endpoint to get messages with a specific contact
    """
    # Check if user is verified through calculator
    if not request.session.get('calculator_verified', False):
        return HttpResponseForbidden()
    
    try:
        contact = User.objects.get(id=contact_id)
        
        # Check if this is a valid contact
        is_contact = Contact.objects.filter(owner=request.user, contact_user=contact).exists()
        if not is_contact:
            return JsonResponse({'status': 'error', 'message': 'Invalid contact'})
        
        # Get messages between users
        messages_query = Message.objects.filter(
            (Q(sender=request.user) & Q(receiver=contact)) | 
            (Q(sender=contact) & Q(receiver=request.user))
        ).order_by('sent_on')
        
        # Mark unread messages as read
        Message.objects.filter(
            sender=contact,
            receiver=request.user,
            is_read=False
        ).update(is_read=True)
        
        # Get user's public key (private key is now stored client-side)
        try:
            user_key = MessageKey.objects.get(user=request.user)
            
            messages_data = []
            for msg in messages_query:
                # Return encrypted content for client-side decryption
                # For sent messages, try to find a self-copy
                encrypted_content = msg.content
                if msg.sender == request.user:
                    # Try to find a copy of this message where we're the receiver
                    self_copy = Message.objects.filter(
                        sender=msg.receiver,
                        receiver=request.user,
                        sent_on__gte=msg.sent_on - timezone.timedelta(seconds=2),
                        sent_on__lte=msg.sent_on + timezone.timedelta(seconds=2)
                    ).first()
                    
                    if self_copy:
                        # We found a copy we encrypted for ourselves
                        encrypted_content = self_copy.content
                
                # Provide placeholder content (will be decrypted client-side)
                placeholder_content = "🔒 Encrypted message"
                    
                messages_data.append({
                    'id': msg.id,
                    'content': placeholder_content,
                    'encrypted_content': encrypted_content,
                    'sent_on': msg.sent_on.strftime('%Y-%m-%d %H:%M:%S'),
                    'sender': msg.sender.username,
                    'is_self': msg.sender == request.user,
                    'is_read': msg.is_read
                })
            
            return JsonResponse({'status': 'success', 'messages': messages_data})
            
        except MessageKey.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'You have no encryption key'})
        
    except User.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'User does not exist'})

@login_required
def settings_view(request):
    """
    User settings view
    """
    # Check if user is verified through calculator
    if not request.session.get('calculator_verified', False):
        return redirect('calculator_view')
    
    profile = get_object_or_404(UserProfile, user=request.user)
    
    if request.method == 'POST':
        # Update calculator password
        new_password = request.POST.get('calculator_password')
        if new_password:
            profile.calculator_password = new_password
            profile.save()
            messages.success(request, 'Your calculator password has been updated.')
        
        # Update theme preference
        theme = request.POST.get('theme')
        if theme in ['light', 'dark']:
            profile.theme = theme
            profile.save()
            messages.success(request, 'Your theme preference has been updated.')
            
        return redirect('settings_view')
    
    return render(request, 'core/settings.html', {
        'profile': profile
    })

@login_required
def security_verification_view(request, contact_id):
    """
    Security verification view - similar to WhatsApp's security code verification
    """
    # Check if user is verified through calculator
    if not request.session.get('calculator_verified', False):
        return redirect('calculator_view')
    
    # Get the contact
    contact = get_object_or_404(Contact, id=contact_id, owner=request.user)
    contact_user = contact.contact_user
    
    # Get keys
    try:
        user_key = MessageKey.objects.get(user=request.user)
        contact_key = MessageKey.objects.get(user=contact_user)
        
        # Get or generate security code
        if not contact.security_code:
            # Use the signal protocol to generate a security code
            from .signal_protocol import generate_security_verification_code
            security_code = generate_security_verification_code(
                user_key.public_key, 
                contact_key.public_key
            )
            contact.security_code = security_code
            contact.save()
        
        # Handle verification confirmation
        if request.method == 'POST':
            action = request.POST.get('action')
            if action == 'verify':
                contact.security_verified = True
                contact.save()
                messages.success(request, f'You have verified the security code for {contact_user.username}.')
                return redirect('messages_view')
        
        # Generate QR code data for verification
        from .signal_protocol import generate_qr_verification_data
        qr_data = generate_qr_verification_data(
            user_key.public_key,
            contact_key.public_key
        )
        
        return render(request, 'core/security_verification.html', {
            'contact': contact,
            'security_code': contact.security_code,
            'qr_data': qr_data
        })
    
    except MessageKey.DoesNotExist:
        messages.error(request, 'Missing encryption keys.')
        return redirect('messages_view')

@login_required
@csrf_exempt
def decrypt_message_api(request):
    """
    API endpoint to decrypt a message using the client-provided private key
    """
    # Check if user is verified through calculator
    if not request.session.get('calculator_verified', False):
        return JsonResponse({'status': 'error', 'message': 'Authentication required'}, status=403)
    
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'POST method required'}, status=405)
    
    try:
        data = json.loads(request.body)
        encrypted_message = data.get('encrypted_message')
        private_key = data.get('private_key')
        
        if not encrypted_message or not private_key:
            return JsonResponse({'status': 'error', 'message': 'Missing required parameters'}, status=400)
        
        # Decrypt the message
        try:
            decrypted_message = decrypt_message(encrypted_message, private_key)
            return JsonResponse({
                'status': 'success',
                'decrypted_message': decrypted_message
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
        
    except json.JSONDecodeError:
        return JsonResponse({'status': 'error', 'message': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
