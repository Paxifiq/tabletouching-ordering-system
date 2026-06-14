#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <Keypad.h>
#include <Servo.h>

// Wiring:
// LCD SDA -> D2 / GPIO4
// LCD SCL -> D1 / GPIO5
// Servo signal -> D5 / GPIO14
// Servo red -> VV, servo brown/black -> GND
//
// Keypad:
// R1 -> D0, R2 -> D3, R3 -> D4, R4 -> D6
// C1 -> D7, C2 -> D8, C3 -> RX/GPIO3, C4 -> TX/GPIO1
//
// Do not press keypad keys while the NodeMCU is booting.
// RX/TX keypad pins can interfere with Serial Monitor uploads/logs.

LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo doorServo;

const int SERVO_PIN = D5;

// Put your WiFi details here.
const char* WIFI_SSID = "Pacifiq";
const char* WIFI_PASSWORD = "123456789";

// Use your computer/server LAN IP. Do not use localhost on NodeMCU.
// Example: http://192.168.1.50:4000
const String API_BASE_URL = "http://10.16.13.34:4000";

String enteredCode = "";

const byte ROWS = 4;
const byte COLS = 4;

char keys[ROWS][COLS] = {
  {'D', 'C', 'B', 'A'},
  {'#', '9', '6', '3'},
  {'0', '8', '5', '2'},
  {'7', '*', '4', '1'}
};

byte rowPins[ROWS] = {D0, D3, D4, D6};
byte colPins[COLS] = {D7, D8, 3, 1};

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

void showHome() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Customer Code:");
  lcd.setCursor(0, 1);
  lcd.print("#/D=OK A=Clear");
}

void showMessage(const char* line1, const char* line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

void showTypedCode() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Code:");
  lcd.setCursor(0, 1);
  lcd.print(enteredCode);
}

void unlockServo() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Code Accepted");
  lcd.setCursor(0, 1);
  lcd.print("Opening...");

  doorServo.write(90);
  delay(3000);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Closing...");

  doorServo.write(0);
  delay(1000);

  enteredCode = "";
  showHome();
}

void denyAccess(const char* message) {
  showMessage("Access Denied", message);
  delay(1500);

  enteredCode = "";
  showHome();
}

bool connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }

  showMessage("Connecting WiFi", "Please wait...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < 15000) {
    delay(500);
  }

  return WiFi.status() == WL_CONNECTED;
}

String getJsonText(String payload, String fieldName) {
  String marker = "\"" + fieldName + "\":\"";
  int start = payload.indexOf(marker);

  if (start < 0) {
    return "";
  }

  start += marker.length();
  int end = payload.indexOf("\"", start);

  if (end < 0) {
    return "";
  }

  return payload.substring(start, end);
}

bool isAccessAllowed(String code, String &message) {
  if (!connectWiFi()) {
    message = "WiFi Failed";
    return false;
  }

  WiFiClient client;
  HTTPClient http;
  String url = API_BASE_URL + "/api/customer-codes/" + code + "/access";

  showMessage("Checking Code", "Please wait...");

  if (!http.begin(client, url)) {
    message = "Bad API URL";
    return false;
  }

  int httpCode = http.GET();
  String payload = http.getString();
  http.end();

  if (httpCode <= 0) {
    message = "No API Reply";
    return false;
  }

  if (httpCode == 404) {
    message = "Code Not Found";
    return false;
  }

  if (httpCode != 200) {
    message = "HTTP " + String(httpCode);
    return false;
  }

  message = getJsonText(payload, "message");

  if (payload.indexOf("\"allowed\":true") >= 0) {
    return true;
  }

  if (message.length() == 0) {
    message = "Not Paid";
  }

  return false;
}

void setup() {
  Wire.begin(D2, D1);

  lcd.init();
  lcd.backlight();

  doorServo.attach(SERVO_PIN);
  doorServo.write(0);

  if (connectWiFi()) {
    showMessage("WiFi Connected", WiFi.localIP().toString().c_str());
    delay(1500);
  } else {
    showMessage("WiFi Failed", "Try again");
    delay(1500);
  }

  showHome();
}

void loop() {
  char key = keypad.getKey();

  if (!key) {
    return;
  }

  if (key >= '0' && key <= '9') {
    if (enteredCode.length() < 8) {
      enteredCode += key;
    }

    showTypedCode();
  }

  if (key == 'A') {
    enteredCode = "";
    showHome();
  }

  if (key == '#' || key == 'D') {
    if (enteredCode.length() == 0) {
      denyAccess("Enter code");
    } else {
      String accessMessage = "";

      if (isAccessAllowed(enteredCode, accessMessage)) {
        unlockServo();
      } else {
        denyAccess(accessMessage.c_str());
      }
    }
  }
}
