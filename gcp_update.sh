# Deploy to Google Cloud Platform
sudo docker build -t bag .
gcloud builds submit --tag us-east4-docker.pkg.dev/bag-client/bag/bag:1.0.0 .
gcloud run deploy bag --image us-east4-docker.pkg.dev/bag-client/bag/bag:1.0.0 --region us-east4 --allow-unauthenticated --min-instances 1 --max-instances 2 --port 3000 --use-http2