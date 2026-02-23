// File: lib/printer_list_page.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
// Ganti 'flutter_application_1' dengan nama proyek Anda
import 'package:mobile_dago/printer_service.dart';

class PrinterListPage extends StatefulWidget {
  final PrinterService printerService;

  // FIX: Menggunakan super.key (use_super_parameters)
  const PrinterListPage({super.key, required this.printerService});

  @override
  // FIX: Mengembalikan tipe public State<PrinterListPage> (library_private_types_in_public_api)
  State<PrinterListPage> createState() => _PrinterListPageState();
}

class _PrinterListPageState extends State<PrinterListPage> {
  Stream<List<ScanResult>>? _scanStream;

  @override
  void initState() {
    super.initState();
    // Mulai scan saat halaman dibuka
    _scanStream = widget.printerService.scanForPrinters();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Pilih Printer Bluetooth"),
        backgroundColor: Colors.blueAccent,
      ),
      body: StreamBuilder<List<ScanResult>>(
        stream: _scanStream,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(
                child: Text("Tidak ada printer ditemukan. Pastikan printer menyala."));
          }

          // Filter nama kosong
          var foundDevices = snapshot.data!
              .where((r) => r.device.platformName.isNotEmpty)
              .toList();

          return ListView.builder(
            itemCount: foundDevices.length,
            itemBuilder: (context, index) {
              var result = foundDevices[index];
              return ListTile(
                title: Text(result.device.platformName),
                subtitle: Text(result.device.remoteId.toString()),
                leading: const Icon(Icons.print),
                onTap: () async {
                  // Saat printer diklik:
                  // 1. Sambungkan dan simpan printer
                  await widget.printerService.connectToPrinter(result.device);

                  // FIX: Cek apakah widget masih ada di tree sebelum navigasi (use_build_context_synchronously)
                  if (!context.mounted) return;

                  // 2. Tutup halaman ini dan kirim nama printer kembali
                  Navigator.pop(context, result.device.platformName);
                },
              );
            },
          );
        },
      ),
    );
  }
}