from django.contrib import admin
from .models import UserProfile, Contact, Message, MessageKey

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'calculator_password')
    search_fields = ('user__username',)

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('owner', 'contact_user', 'added_on')
    search_fields = ('owner__username', 'contact_user__username')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'sent_on', 'is_read')
    list_filter = ('is_read', 'sent_on')
    search_fields = ('sender__username', 'receiver__username')

@admin.register(MessageKey)
class MessageKeyAdmin(admin.ModelAdmin):
    list_display = ('user', 'public_key_available')
    
    def public_key_available(self, obj):
        return bool(obj.public_key)
    
    public_key_available.boolean = True
