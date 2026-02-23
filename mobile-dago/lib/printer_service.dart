// File: lib/printer_service.dart
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart'; 
import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:intl/intl.dart'; // Sekarang ini akan Terpakai

class PrinterService {
  static BluetoothDevice? _printer;

  Future<void> requestPermissions() async {
    await [
      Permission.bluetooth,
      Permission.bluetoothScan,
      Permission.bluetoothConnect,
      Permission.location,
    ].request();
  }

  // Scan Printer
  Stream<List<ScanResult>> scanForPrinters() {
    debugPrint("Mulai memindai printer...");
    
    // Cek Bluetooth On/Off
    FlutterBluePlus.adapterState.listen((state) {
      if (state == BluetoothAdapterState.off) {
        try {
           // Auto turn on handling
        } catch (e) {
          debugPrint("Bluetooth Error: $e");
        }
      }
    });

    FlutterBluePlus.startScan(timeout: const Duration(seconds: 5));
    return FlutterBluePlus.scanResults;
  }

  // Connect
  Future<void> connectToPrinter(BluetoothDevice device) async {
    // FIX: Gunakan platformName agar warning hilang
    debugPrint("Mencoba terhubung ke: ${device.platformName}"); 
    
    await FlutterBluePlus.stopScan();

    try {
      await device.connect(autoConnect: false);
      _printer = device;
      debugPrint("Printer terhubung: ${device.platformName}");
    } catch (e) {
      debugPrint("Gagal connect: $e");
      try { await device.disconnect(); } catch (_) {}
    }
  }

  static BluetoothDevice? getConnectedPrinter() {
    return _printer;
  }

  Future<void> disconnectPrinter() async {
    if (_printer == null) return;
    try {
      await _printer!.disconnect();
    } catch (e) {
      debugPrint("Error disconnect: $e");
    } finally {
      _printer = null;
    }
  }

  // --- PRINT STRUK ---
  Future<void> printReceipt(Map<String, dynamic> dataStruk) async {
    if (_printer == null) {
      debugPrint("Printer belum connect.");
      return;
    }

    // Cek koneksi
    try {
      // ignore: deprecated_member_use
      if (_printer!.isConnected == false) {
         await _printer!.connect(autoConnect: false);
      }
    } catch (e) { debugPrint("$e"); }

    // Generator
    final profile = await CapabilityProfile.load();
    final generator = Generator(PaperSize.mm58, profile);
    List<int> bytes = [];

    // Parsing Data
    double total = (dataStruk['total'] ?? 0).toDouble();
    List items = dataStruk['items'] ?? [];

    // FIX: Gunakan DateFormat agar library intl terpakai
    String dateStr;
    if (dataStruk['time'] != null) {
      try {
        dateStr = DateFormat('dd/MM/yy HH:mm').format(DateTime.parse(dataStruk['time']));
      } catch (e) {
        dateStr = dataStruk['time'];
      }
    } else {
      dateStr = DateFormat('dd/MM/yy HH:mm').format(DateTime.now());
    }

    // Header
    bytes += generator.text('DagoEng', styles: const PosStyles(align: PosAlign.center, bold: true));
    bytes += generator.text('Creative Hub', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.feed(1);
    
    // FIX: Masukkan variabel dateStr ke struk agar variabelnya terpakai
    bytes += generator.text('Waktu: $dateStr'); 
    bytes += generator.hr();
    
    // Isi
    for (var item in items) {
      bytes += generator.text('${item['name']} x${item['qty']}');
      bytes += generator.text('Rp ${item['price']}', styles: const PosStyles(align: PosAlign.right));
    }
    
    bytes += generator.hr();
    bytes += generator.text('TOTAL: Rp ${total.toInt()}', styles: const PosStyles(align: PosAlign.right, bold: true, height: PosTextSize.size2));
    bytes += generator.feed(2);
    bytes += generator.cut();

    // Kirim Data
    try {
      List<BluetoothService> services = await _printer!.discoverServices();
      for (var service in services) {
        for (var c in service.characteristics) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
             // Kirim (Chunking)
             int chunkSize = 200;
             for (int i = 0; i < bytes.length; i += chunkSize) {
                int end = (i + chunkSize < bytes.length) ? i + chunkSize : bytes.length;
                await c.write(bytes.sublist(i, end), withoutResponse: true);
                await Future.delayed(const Duration(milliseconds: 20));
             }
             return;
          }
        }
      }
    } catch (e) {
      debugPrint("Gagal Print: $e");
    }
  }
}