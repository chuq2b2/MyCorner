import os
from dotenv import load_dotenv
import logging
import boto3
from botocore.exceptions import ClientError

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AWS Configuration
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
AWS_BUCKET_NAME = os.getenv('AWS_BUCKET_NAME')

# Initialize AWS S3 client
try:
    s3_client = boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )
    logger.info("AWS S3 client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize AWS S3 client: {str(e)}")
    s3_client = None

def upload_file_to_s3(file_path, object_name=None, metadata=None):
    """Upload a file to an S3 bucket

    :param file_path: File to upload
    :param object_name: S3 object name. If not specified then file_name is used
    :param metadata: Optional metadata to attach to the file
    :return: True if file was uploaded, else False
    """
    if not object_name:
        object_name = os.path.basename(file_path)

    try:
        extra_args = {'Metadata': metadata} if metadata else {}
        s3_client.upload_file(file_path, AWS_BUCKET_NAME, object_name, ExtraArgs=extra_args)
        logger.info(f"Successfully uploaded {object_name} to S3")
        return True
    except ClientError as e:
        logger.error(f"Failed to upload {object_name} to S3: {str(e)}")
        return False

def get_s3_file_url(object_name):
    """Generate a presigned URL for an S3 object

    :param object_name: S3 object name
    :return: Presigned URL as string. If error, returns None.
    """
    try:
        url = s3_client.generate_presigned_url('get_object',
                                             Params={'Bucket': AWS_BUCKET_NAME,
                                                    'Key': object_name},
                                             ExpiresIn=3600)  # URL expires in 1 hour
        return url
    except ClientError as e:
        logger.error(f"Failed to generate presigned URL for {object_name}: {str(e)}")
        return None

def list_s3_files(prefix=''):
    """List files in S3 bucket with optional prefix

    :param prefix: Optional prefix to filter files
    :return: List of dictionaries containing file information
    """
    try:
        response = s3_client.list_objects_v2(Bucket=AWS_BUCKET_NAME, Prefix=prefix)
        files = []
        for obj in response.get('Contents', []):
            file_info = {
                'key': obj['Key'],
                'last_modified': obj['LastModified'],
                'size': obj['Size'],
                'url': get_s3_file_url(obj['Key'])
            }
            try:
                metadata = s3_client.head_object(Bucket=AWS_BUCKET_NAME, Key=obj['Key'])['Metadata']
                file_info['metadata'] = metadata
            except:
                file_info['metadata'] = {}
            files.append(file_info)
        return sorted(files, key=lambda x: x['last_modified'], reverse=True)
    except ClientError as e:
        logger.error(f"Failed to list files in S3: {str(e)}")
        return [] 