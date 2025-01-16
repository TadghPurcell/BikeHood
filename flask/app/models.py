from app.database import db

class AirQuality(db.Model):
    __tablename__ = 'environment'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.Integer, nullable=False)  
    location = db.Column(db.String(255), nullable=False) 
    pm2_5 = db.Column(db.Float)  
    temperature = db.Column(db.Float)  
    weather = db.Column(db.String(255)) 
    wind_speed = db.Column(db.Float)  
    rain = db.Column(db.Float)  

    def __repr__(self):
        return f"<Environment {self.location}, {self.timestamp}>"

class TomTom(db.Model):
    __tablename__ = 'tomtom'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.Integer, nullable=False)  
    ongar_distributor_road = db.Column(db.Float)
    littleplace_castleheaney_distributor_road_south = db.Column(db.Float)
    main_street = db.Column(db.Float)
    the_mall = db.Column(db.Float)
    station_road = db.Column(db.Float)
    ongar_distributor_road_east = db.Column(db.Float)
    ongar_barnhill_distributor_road = db.Column(db.Float)
    littleplace_castleheaney_distributor_road_north = db.Column(db.Float)
    the_avenue = db.Column(db.Float)

    def __repr__(self):
        return f"<TomTom {self.timestamp}>"
        
class NoisePollution(db.Model):
    __tablename__ = 'noisepollution'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.Integer, nullable=False)  
    datetime = db.Column(db.DateTime, nullable=False) 
    laeq = db.Column(db.Float, nullable=False)  
    lafmax = db.Column(db.Float, nullable=False) 
    la10 = db.Column(db.Float, nullable=False) 
    la90 = db.Column(db.Float, nullable=False) 
    lceq = db.Column(db.Float, nullable=False)  
    lcfmax = db.Column(db.Float, nullable=False) 
    lc10 = db.Column(db.Float, nullable=False)  
    lc90 = db.Column(db.Float, nullable=False)  

    def __repr__(self):
        return f"<NoisePollution {self.timestamp}>"