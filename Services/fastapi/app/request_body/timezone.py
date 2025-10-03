from pydantic import BaseModel

class TimezoneData(BaseModel):
    timezone: str