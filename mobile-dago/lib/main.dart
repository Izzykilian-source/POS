// File: lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:mobile_dago/printer_service.dart';
import 'package:mobile_dago/printer_list_page.dart';

// Inisialisasi service printer
final PrinterService _printerService = PrinterService();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const KasirApp());
}

class KasirApp extends StatelessWidget {
  const KasirApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: WebViewScreen(),
    );
  }
}

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  InAppWebViewController? _webViewController;

  // IP ADDRESS (Pastikan ini sesuai IP Laptop Anda)
 // GANTI BARIS INI:
final String reactUrl = "http://172.16.80.51:5173";

  @override
  void initState() {
    super.initState();
    _printerService.requestPermissions();
  }

  void _injectBridge(InAppWebViewController controller) {
    debugPrint("Menyuntikkan jembatan JavaScript...");

    // 1. Bridge PRINT
    controller.addJavaScriptHandler(
      handlerName: 'flutterPrintHandler',
      callback: (args) {
        debugPrint("REACT MINTA PRINT");
        if (args.isNotEmpty) {
          Map<String, dynamic> dataStruk = Map<String, dynamic>.from(args[0]);
          _printerService.printReceipt(dataStruk);
        }
      },
    );

    // 2. Bridge LIST PRINTER
    controller.addJavaScriptHandler(
        handlerName: 'flutterShowPrinterList',
        callback: (args) async {
          debugPrint("REACT MINTA LIST PRINTER");
          final String? selectedName = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) =>
                  PrinterListPage(printerService: _printerService),
            ),
          );
          if (selectedName != null) {
            debugPrint("Printer terpilih: $selectedName");
            _webViewController?.evaluateJavascript(
                source: 'window.updatePrinterName("$selectedName")');
          }
        });

    // 3. Bridge GET CONNECTED PRINTER
    controller.addJavaScriptHandler(
        handlerName: 'flutterGetConnectedPrinter',
        callback: (args) {
          var printer = PrinterService.getConnectedPrinter();
          if (printer != null) {
            // PERBAIKAN FINAL: Menggunakan .platformName agar warning hilang
            // Jika nanti error merah, ganti balik ke .name
            _webViewController?.evaluateJavascript(
                source: 'window.updatePrinterName("${printer.platformName}")');
          }
        });

    // 4. Bridge DISCONNECT
    controller.addJavaScriptHandler(
        handlerName: 'flutterDisconnectPrinter',
        callback: (args) async {
          debugPrint("REACT MINTA DISCONNECT");
          await _printerService.disconnectPrinter();
          _webViewController?.evaluateJavascript(
              source: 'window.updatePrinterName(null)');
        });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: InAppWebView(
          initialUrlRequest: URLRequest(url: WebUri(reactUrl)),
          initialSettings: InAppWebViewSettings(
            javaScriptEnabled: true,
            useShouldOverrideUrlLoading: true,
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserGesture: false,
            cacheEnabled: false, 
          ),
          onWebViewCreated: (controller) {
            _webViewController = controller;
          },
          onLoadStop: (controller, url) {
            debugPrint("Page Loaded: $url");
            _injectBridge(controller);
          },
          onProgressChanged: (controller, progress) {
            if (progress == 100) {
              _injectBridge(controller);
            }
          },
          onConsoleMessage: (controller, consoleMessage) {
            debugPrint("JS Log: ${consoleMessage.message}");
          },
        ),
      ),
    );
  }
}