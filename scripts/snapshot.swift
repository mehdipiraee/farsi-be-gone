// Usage: swift scripts/snapshot.swift <html-file> <out.png> [width height]
import Cocoa
import WebKit

let args = CommandLine.arguments
let src = URL(fileURLWithPath: args[1])
let out = URL(fileURLWithPath: args[2])
let w = args.count > 3 ? Double(args[3])! : 1280
let h = args.count > 4 ? Double(args[4])! : 800

class Loader: NSObject, WKNavigationDelegate {
  let web: WKWebView
  init(_ web: WKWebView) { self.web = web }
  func webView(_ v: WKWebView, didFinish _: WKNavigation!) {
    // give content scripts a moment to run before snapshotting
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
      let cfg = WKSnapshotConfiguration()
      cfg.rect = CGRect(x: 0, y: 0, width: w, height: h)
      cfg.snapshotWidth = NSNumber(value: w)
      v.takeSnapshot(with: cfg) { img, _ in
        guard let img = img, let tiff = img.tiffRepresentation,
              let rep = NSBitmapImageRep(data: tiff),
              let png = rep.representation(using: .png, properties: [:]) else { exit(1) }
        try? png.write(to: out)
        exit(0)
      }
    }
  }
}

let app = NSApplication.shared
app.setActivationPolicy(.prohibited)
let web = WKWebView(frame: CGRect(x: 0, y: 0, width: w, height: h))
let loader = Loader(web)
web.navigationDelegate = loader
let win = NSWindow(contentRect: web.frame, styleMask: [.borderless], backing: .buffered, defer: false)
win.contentView = web
win.orderBack(nil)
web.loadFileURL(src, allowingReadAccessTo: src.deletingLastPathComponent().deletingLastPathComponent())
app.run()
