from django.urls import path
from . import views

urlpatterns = [
    path('', views.calculator_view, name='calculator_view'),
    path('verify-password/', views.verify_calculator_password, name='verify_calculator_password'),
    path('register/', views.register_view, name='register_view'),
    path('login/', views.login_view, name='login_view'),
    path('logout/', views.logout_view, name='logout_view'),
    path('messages/', views.messages_view, name='messages_view'),
    path('contacts/', views.contacts_view, name='contacts_view'),
    path('contacts/delete/<int:contact_id>/', views.delete_contact, name='delete_contact'),
    path('settings/', views.settings_view, name='settings_view'),
    
    # Security features (WhatsApp-like)
    path('security/verify/<int:contact_id>/', views.security_verification_view, name='security_verification'),
    
    # API endpoints
    path('api/send-message/', views.send_message, name='send_message'),
    path('api/get-messages/<int:contact_id>/', views.get_messages, name='get_messages'),
]
