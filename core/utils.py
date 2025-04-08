from .models import Contact, Message
from django.db.models import Q, Count, Max, F, ExpressionWrapper, DateTimeField
from django.db.models.functions import Greatest

def get_contacts_with_unread_count(user):
    """
    Get all contacts of a user with the number of unread messages from each contact
    """
    return Contact.objects.filter(owner=user).select_related('contact_user').annotate(
        unread_count=Count(
            'contact_user__sent_messages',
            filter=Q(contact_user__sent_messages__receiver=user, contact_user__sent_messages__is_read=False)
        )
    )

def get_contact_with_last_message(user):
    """
    Get all contacts of a user with their last message timestamp
    """
    contacts = Contact.objects.filter(owner=user).select_related('contact_user')
    
    result = []
    for contact in contacts:
        # Get the most recent message between the user and this contact
        last_message = Message.objects.filter(
            (Q(sender=user) & Q(receiver=contact.contact_user)) | 
            (Q(sender=contact.contact_user) & Q(receiver=user))
        ).order_by('-sent_on').first()
        
        result.append({
            'contact': contact,
            'last_message': last_message
        })
    
    # Sort by last message time, most recent first
    return sorted(result, key=lambda x: x['last_message'].sent_on if x['last_message'] else 0, reverse=True)
