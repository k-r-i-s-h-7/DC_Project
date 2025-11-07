FROM python:3.10-slim

WORKDIR C:/Users/ASUS/Documents/Study/Distributed_Computing/EXP_8_2/coordinator

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "coordinator.py"]
