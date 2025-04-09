import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from .models import Message, Contact, MessageKey
from .encryption import encrypt_message, decrypt_message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        self.contact_id = self.scope['url_route']['kwargs']['contact_id']
        
        # Check if user is authenticated
        if not self.user.is_authenticated:
            # Close connection if user is not authenticated
            await self.close()
            return
        
        # Check if calculator_verified is in session
        session = self.scope['session']
        if not session.get('calculator_verified', False):
            # Close connection if user is not verified through calculator
            await self.close()
            return
        
        # Check if contact exists
        try:
            contact_exists = await self.check_contact_exists()
            if not contact_exists:
                # Close connection if contact does not exist
                await self.close()
                return
        except Exception:
            # Close connection if there was an error checking the contact
            await self.close()
            return
        
        # Create a unique room name for this chat
        user_ids = sorted([self.user.id, int(self.contact_id)])
        self.room_group_name = f'chat_{user_ids[0]}_{user_ids[1]}'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_type = text_data_json.get('type')
        
        if message_type == 'chat_message':
            # Handle new chat message
            content = text_data_json.get('message')
            
            try:
                # Save message to database and get the message object
                message_data = await self.save_message(content)
                
                # Send message to room group if successful
                if 'error' not in message_data:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'chat_message',
                            'message': content if self.user.id == self.scope["user"].id else message_data['content'],
                            'sender_id': self.user.id,
                            'message_id': message_data['message_id'],
                            'timestamp': message_data['timestamp'].isoformat(),
                        }
                    )
            except Exception as e:
                print(f"Error sending message: {str(e)}")
        elif message_type == 'read_receipt':
            # Handle read receipt
            message_id = text_data_json.get('message_id')
            
            try:
                # Mark message as read
                read_success = await self.mark_message_read(message_id)
                
                # Send read receipt to room group if successfully marked as read
                if read_success:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'read_receipt',
                            'message_id': message_id,
                            'reader_id': self.user.id,
                        }
                    )
            except Exception as e:
                print(f"Error marking message as read: {str(e)}")
    
    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender_id': event['sender_id'],
            'message_id': event['message_id'],
            'timestamp': event['timestamp'],
        }))
    
    # Receive read receipt from room group
    async def read_receipt(self, event):
        # Send read receipt to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'message_id': event['message_id'],
            'reader_id': event['reader_id'],
        }))
    
    @database_sync_to_async
    def check_contact_exists(self):
        try:
            contact_user = User.objects.get(id=self.contact_id)
            return Contact.objects.filter(owner=self.user, contact_user=contact_user).exists()
        except User.DoesNotExist:
            return False
    
    @database_sync_to_async
    def save_message(self, content):
        try:
            # Get contact user
            contact_user = User.objects.get(id=self.contact_id)
            
            # Get receiver's public key
            receiver_key = MessageKey.objects.get(user=contact_user)
            
            # Encrypt the message with receiver's public key
            encrypted_content = encrypt_message(content, receiver_key.public_key)
            
            # Save the encrypted message
            message = Message.objects.create(
                sender=self.user,
                receiver=contact_user,
                content=encrypted_content,
                is_read=False,
                sent_on=timezone.now()
            )
            
            return {
                'message_id': message.id,
                'content': content,  # Return the original content for the sender
                'timestamp': message.sent_on
            }
        except User.DoesNotExist:
            return {'error': 'User does not exist'}
        except MessageKey.DoesNotExist:
            return {'error': 'Receiver has no encryption key'}
    
    @database_sync_to_async
    def mark_message_read(self, message_id):
        try:
            # Only mark messages as read if the current user is the receiver
            message = Message.objects.get(
                id=message_id,
                receiver=self.user,
                is_read=False
            )
            message.is_read = True
            message.save()
            return True
        except Message.DoesNotExist:
            return False