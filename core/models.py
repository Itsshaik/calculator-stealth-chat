from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    calculator_password = models.CharField(max_length=255, help_text="Password to access messaging from calculator")
    theme = models.CharField(max_length=10, choices=[('light', 'Light'), ('dark', 'Dark')], default='light')
    
    def __str__(self):
        return f"{self.user.username}'s Profile"

class MessageKey(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='message_key')
    public_key = models.TextField()
    private_key = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Keys"

class Contact(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contacts')
    contact_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contacted_by')
    added_on = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['owner', 'contact_user']
        
    def __str__(self):
        return f"{self.owner.username} -> {self.contact_user.username}"

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField(help_text="Encrypted message content")
    sent_on = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-sent_on']
        
    def __str__(self):
        return f"Message from {self.sender.username} to {self.receiver.username} at {self.sent_on}"
