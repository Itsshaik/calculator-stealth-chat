from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm

class UserRegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']
        
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('This email address is already in use.')
        return email

class UserLoginForm(forms.Form):
    username = forms.CharField(max_length=150)
    password = forms.CharField(widget=forms.PasswordInput)

class CalculatorPasswordForm(forms.Form):
    calculator_password = forms.CharField(
        widget=forms.PasswordInput,
        help_text="This is the password you will enter in the calculator to access messages."
    )
    
    def clean_calculator_password(self):
        password = self.cleaned_data.get('calculator_password')
        # Ensure password is at least 4 characters
        if len(password) < 4:
            raise forms.ValidationError('Calculator password must be at least 4 characters long.')
        return password

class ContactForm(forms.Form):
    username = forms.CharField(
        max_length=150,
        help_text="Enter the username of the person you want to add as a contact."
    )

class MessageForm(forms.Form):
    receiver_id = forms.IntegerField(widget=forms.HiddenInput)
    content = forms.CharField(widget=forms.Textarea)
