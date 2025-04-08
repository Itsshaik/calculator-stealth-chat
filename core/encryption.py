from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend
import base64

def generate_key_pair():
    """
    Generate a new RSA key pair for end-to-end encryption
    Returns (public_key_pem, private_key_pem)
    """
    # Generate a private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    
    # Get the public key
    public_key = private_key.public_key()
    
    # Serialize keys to PEM format
    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')
    
    public_key_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')
    
    return public_key_pem, private_key_pem

def encrypt_message(message, public_key_pem):
    """
    Encrypt a message using the recipient's public key
    """
    # Load the public key
    public_key = serialization.load_pem_public_key(
        public_key_pem.encode('utf-8'),
        backend=default_backend()
    )
    
    # Due to RSA limitations, we need to chunk the message
    # if it's longer than the max allowed size
    message_bytes = message.encode('utf-8')
    
    # For RSA 2048, max size is around 245 bytes per chunk
    chunk_size = 245
    chunks = [message_bytes[i:i + chunk_size] for i in range(0, len(message_bytes), chunk_size)]
    
    encrypted_chunks = []
    for chunk in chunks:
        encrypted = public_key.encrypt(
            chunk,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        # Base64 encode each encrypted chunk
        encrypted_chunks.append(base64.b64encode(encrypted).decode('utf-8'))
    
    # Join chunks with delimiter
    return '|'.join(encrypted_chunks)

def decrypt_message(encrypted_message, private_key_pem):
    """
    Decrypt a message using the recipient's private key
    """
    # Load the private key
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode('utf-8'),
        password=None,
        backend=default_backend()
    )
    
    # Split the message into chunks
    encrypted_chunks = encrypted_message.split('|')
    
    decrypted_chunks = []
    for chunk in encrypted_chunks:
        # Base64 decode each chunk
        encrypted_data = base64.b64decode(chunk)
        
        # Decrypt the chunk
        decrypted = private_key.decrypt(
            encrypted_data,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        decrypted_chunks.append(decrypted)
    
    # Join decrypted chunks and convert to string
    return b''.join(decrypted_chunks).decode('utf-8')
