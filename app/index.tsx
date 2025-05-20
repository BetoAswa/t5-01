import { useState, useEffect } from "react";
import { Text, View, StyleSheet, Button, FlatList, TouchableOpacity, Alert } from "react-native";

import * as Location from "expo-location";
import * as Clipboard from "expo-clipboard";
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

const API_URL = "http://localhost:3000/codigos"; 

export default () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedCodes, setScannedCodes] = useState<ScannedCode[]>([]);

  // Obtener ubicación y códigos desde backend al inicio
  useEffect(() => {
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    }

    async function fetchCodigos() {
      try {
        const response = await fetch(API_URL, {
          headers: { Accept: "application/json" }
        });
        if (response.ok) {
          const data = await response.json();
          setScannedCodes(data);
        } else {
          console.error("Error al obtener códigos", response.status);
        }
      } catch (e) {
        console.error("Error fetch codigos:", e);
      }
    }

    getCurrentLocation();
    fetchCodigos();
  }, []);

  if (!permission) return <View />;
  if (!permission.granted)
    return (
      <View>
        <Text>Camera permission is required to use this app.</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );

  let text = "Waiting..";
  if (errorMsg) text = errorMsg;
  else if (location) text = JSON.stringify(location);

  // POST código al backend
  const onBarcodeScanned = async (result: BarcodeScanningResult) => {
    const scannedData = {
      id: generateId(),
      data: result.data,
      type: result.type
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
          Accept: "application/json"
        },
        body: JSON.stringify(scannedData)
      });
      if (response.ok) {
        const saved = await response.json();
        setScannedCodes(prev => [...prev, saved]);
      } else {
        Alert.alert("Error", "No se pudo guardar el código");
      }
    } catch (e) {
      Alert.alert("Error", "Error al conectar con el servidor");
    }
  };

  // DELETE código desde app
const deleteCodigo = async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        "Accept": "application/json", 
        "Content-Type": "application/json" 
      }
    });

    if (response.ok) {
      setScannedCodes(prev => prev.filter(c => c.id !== id));
    } else {
      const error = await response.json();
      Alert.alert("Error", error?.error || "No se pudo eliminar el código");
    }
  } catch (e) {
    Alert.alert("Error", "Error al conectar con el servidor");
  }
};


  // Generar id simple 
  function generateId() {
    return Math.random().toString(36).substring(2, 12);
  }

  const ScannedItem = ({ item }: { item: ScannedCode }) => {
    return (
      <View style={{ marginBottom: 10 }}>
        <Text>{item.data}</Text>
        <TouchableOpacity onPress={() => Clipboard.setStringAsync(item.data)}>
          <Text style={{ color: "blue" }}>Copiar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteCodigo(item.id)}>
          <Text style={{ color: "red" }}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Button title="Mostrar notificacion" onPress={() => Notifications.scheduleNotificationAsync({
        content: { title: "Hola", body: "Probandooo" },
        trigger: null
      })} />
      <Text>GPS: {text}</Text>
      <CameraView
        facing={facing}
        style={styles.CameraView}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "code128", "datamatrix", "aztec"]
        }}
        onBarcodeScanned={onBarcodeScanned}
      />
      <FlatList
        data={scannedCodes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ScannedItem item={item} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  CameraView: {
    width: "100%",
    minHeight: 240
  }
});

interface ScannedCode {
  id: string;
  data: string;
  type: string;
}
