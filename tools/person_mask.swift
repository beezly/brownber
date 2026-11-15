// Offline person segmentation using macOS Vision.
// Usage: swift tools/person_mask.swift <in image> <out mask png>
import Foundation
import Vision
import CoreImage
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
guard args.count == 3 else { print("usage: person_mask <in> <out>"); exit(2) }
let url = URL(fileURLWithPath: args[1])
let req = VNGeneratePersonSegmentationRequest()
req.qualityLevel = .accurate
req.outputPixelFormat = kCVPixelFormatType_OneComponent8
let handler = VNImageRequestHandler(url: url, options: [:])
try handler.perform([req])
guard let obs = req.results?.first else { print("no result"); exit(1) }
let ci = CIImage(cvPixelBuffer: obs.pixelBuffer)
// Scale mask to the source image size (respect orientation as Vision does).
let src = CIImage(contentsOf: url, options: [.applyOrientationProperty: true])!
let sx = src.extent.width / ci.extent.width, sy = src.extent.height / ci.extent.height
let scaled = ci.transformed(by: CGAffineTransform(scaleX: sx, y: sy))
let ctx = CIContext()
let cs = CGColorSpaceCreateDeviceGray()
guard let cg = ctx.createCGImage(scaled, from: CGRect(origin: .zero, size: src.extent.size), format: .L8, colorSpace: cs) else { print("render fail"); exit(1) }
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: args[2]) as CFURL, UTType.png.identifier as CFString, 1, nil)!
CGImageDestinationAddImage(dest, cg, nil)
CGImageDestinationFinalize(dest)
