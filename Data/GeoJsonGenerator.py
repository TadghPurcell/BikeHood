# Python script to create a GeoJSON file
import json

coordinates_list = [
    (53.392862, -6.441783, 'Ongar_Distributor_Road'),
    (53.394976, -6.444193, 'Littleplace_Castleheaney_Distributor_Road_South'),
    (53.395872, -6.441064, 'Main_Street'),
    (53.394084, -6.438794, 'The_Mall'),
    (53.391115, -6.439771, 'Station_Road'),
    (53.391576, -6.436851, 'Ongar_Distributor_Road_East'),
    (53.392969, -6.445409, 'Ongar_Barnhill_Distributor_Road'),
    (53.396809, -6.442519, 'Littleplace_Castleheaney_Distributor_Road_North'),
    (53.395994, -6.438525, 'The_Avenue'),
]

# Create GeoJSON structure
geojson = {
    "type": "FeatureCollection",
    "features": []
}

for coord in coordinates_list:
    lat, lon, road_id = coord

    # Create an artificial line for the road
    line = [
        [lon - 0.0005, lat - 0.0005],  
        [lon + 0.0005, lat + 0.0005]   
    ]

    feature = {
        "type": "Feature",
        "properties": {
            "id": road_id,
            "traffic": None  
        },
        "geometry": {
            "type": "LineString",
            "coordinates": line
        }
    }
    geojson["features"].append(feature)

# Save to a file or print
with open("roads.geojson", "w") as f:
    json.dump(geojson, f, indent=2)

print(json.dumps(geojson, indent=2))
