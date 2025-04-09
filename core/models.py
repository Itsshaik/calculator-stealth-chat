from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import secrets
import string
import base64

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    calculator_password = models.CharField(max_length=255, help_text="Password to access messaging from calculator")
    theme = models.CharField(max_length=10, choices=[('light', 'Light'), ('dark', 'Dark')], default='light')
    identity_key_fingerprint = models.CharField(max_length=64, blank=True, null=True, help_text="Fingerprint of identity key for verification")
    
    def __str__(self):
        return f"{self.user.username}'s Profile"

class MessageKey(models.Model):
    """
    Long-term identity keys (similar to Signal's Identity Keys)
    Only public keys are stored on the server. Private keys are stored exclusively on the client side.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='message_key')
    public_key = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Public Identity Key"

class SignedPreKey(models.Model):
    """
    Signal Protocol uses signed pre-keys for the initial handshake
    These keys are long-lived and signed with the identity key
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='signed_prekeys')
    key_id = models.PositiveIntegerField(help_text="Identifier for this pre-key")
    public_key = models.TextField()
    private_key = models.TextField()
    signature = models.TextField(help_text="Signature from identity key")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['user', 'key_id']
    
    def __str__(self):
        return f"{self.user.username}'s Signed Pre-Key {self.key_id}"

class OneTimePreKey(models.Model):
    """
    One-time pre-keys are used once for establishing initial sessions
    and then discarded (similar to Signal's One-Time Pre-Keys)
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='one_time_prekeys')
    key_id = models.PositiveIntegerField(help_text="Identifier for this one-time pre-key")
    public_key = models.TextField()
    private_key = models.TextField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'key_id']
    
    def __str__(self):
        return f"{self.user.username}'s One-Time Pre-Key {self.key_id}"

class ConversationSession(models.Model):
    """
    This represents a Signal-Protocol-like session between two users
    In the Signal Protocol, each conversation has a unique session with rolling keys
    """
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_sessions')
    contact = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contact_sessions')
    session_id = models.CharField(max_length=255, unique=True)
    root_key = models.TextField(help_text="The current root key for the Double Ratchet Algorithm")
    chain_key = models.TextField(help_text="The current chain key for message encryption")
    next_sending_key = models.TextField(help_text="Key for the next message to be sent")
    message_number = models.PositiveIntegerField(default=0, help_text="Number of messages in this session")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['owner', 'contact']
    
    def __str__(self):
        return f"Session between {self.owner.username} and {self.contact.username}"
    
    @classmethod
    def generate_session_id(cls):
        """Generate a unique session ID similar to how WhatsApp might create them"""
        characters = string.ascii_letters + string.digits
        random_part = ''.join(secrets.choice(characters) for _ in range(32))
        return base64.b64encode(random_part.encode()).decode()

class Contact(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contacts')
    contact_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contacted_by')
    added_on = models.DateTimeField(auto_now_add=True)
    security_code = models.CharField(max_length=64, blank=True, null=True, 
                                   help_text="Security verification code like WhatsApp's security code")
    security_verified = models.BooleanField(default=False, 
                                          help_text="Whether the security code has been verified by the user")
    
    class Meta:
        unique_together = ['owner', 'contact_user']
        
    def __str__(self):
        return f"{self.owner.username} -> {self.contact_user.username}"
    
    def generate_security_code(self):
        """Generate a security verification code similar to WhatsApp's 60-digit code"""
        # Create a code similar to WhatsApp's 60-digit verification code
        digit_groups = []
        for _ in range(12):  # 12 groups of 5 digits
            group = ''.join(str(secrets.randbelow(10)) for _ in range(5))
            digit_groups.append(group)
        return ' '.join(digit_groups)

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField(help_text="Encrypted message content")
    sent_on = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    session = models.ForeignKey(ConversationSession, on_delete=models.SET_NULL, null=True, 
                              related_name='messages', help_text="The session used for encryption")
    message_number = models.PositiveIntegerField(default=0, help_text="Position in the session for key verification")
    ephemeral_key = models.TextField(blank=True, null=True, 
                                  help_text="Ephemeral key used for this specific message (for perfect forward secrecy)")
    
    class Meta:
        ordering = ['-sent_on']
        
    def __str__(self):
        return f"Message from {self.sender.username} to {self.receiver.username} at {self.sent_on}"
