import requests
import time
import csv
import sys

# Read stops from file (default: stops.txt)
input_file = sys.argv[1] if len(sys.argv) > 1 else 'stops.txt'
output_file = sys.argv[2] if len(sys.argv) > 2 else 'stops_with_coordinates.csv'

with open(input_file, 'r', encoding='utf-8') as f:
    stops = [line.strip() for line in f if line.strip()]

with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(['Stop Name', 'Latitude', 'Longitude'])
    for stop in stops:
        params = {
            'q': stop + ', Davao City, Philippines',
            'format': 'json',
            'limit': 1,
            'addressdetails': 0
        }
        try:
            response = requests.get('https://nominatim.openstreetmap.org/search', params=params, headers={'User-Agent': 'DavaoTransportApp/1.0'})
            data = response.json()
            if data:
                lat = data[0]['lat']
                lon = data[0]['lon']
                print(f"{stop}: {lat}, {lon}")
                writer.writerow([stop, lat, lon])
            else:
                print(f"Not found: {stop}")
                writer.writerow([stop, '', ''])
        except Exception as e:
            print(f"Error for {stop}: {e}")
            writer.writerow([stop, '', ''])
        time.sleep(1)  # Be polite to the API (Nominatim recommends 1s/request)

print(f"Done! Results saved to {output_file}")