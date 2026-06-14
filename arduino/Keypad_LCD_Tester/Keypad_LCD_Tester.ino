#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>

// Use this sketch only to test keypad wiring.
// LCD SDA -> D2 / GPIO4
// LCD SCL -> D1 / GPIO5

LiquidCrystal_I2C lcd(0x27, 16, 2);

const byte ROWS = 4;
const byte COLS = 4;

char keys[ROWS][COLS] = {
  {'D', 'C', 'B', 'A'},
  {'#', '9', '6', '3'},
  {'0', '8', '5', '2'},
  {'*', '7', '4', '1'}
};

byte rowPins[ROWS] = {D0, D3, D4, D6};
byte colPins[COLS] = {D7, D8, 3, 1};

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, ROWS, COLS);

void setup() {
  Wire.begin(D2, D1);

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Keypad Tester");
  lcd.setCursor(0, 1);
  lcd.print("Press a key");
}

void loop() {
  char key = keypad.getKey();

  if (!key) {
    return;
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Detected key:");
  lcd.setCursor(0, 1);
  lcd.print(key);
}
