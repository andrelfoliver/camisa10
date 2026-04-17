import AppKit

let inputPath = "/Users/andreoliveira/.gemini/antigravity/brain/c77f7cef-e33f-4708-9289-d9ae3d94219d/browser/logo.png"
let outputPath = "/Users/andreoliveira/Documents/Camisa10/public/logo-exact-transparent.png"

guard let image = NSImage(contentsOfFile: inputPath),
      let tiff = image.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiff) else {
    print("Erro ao carregar imagem")
    exit(1)
}

let width = bitmap.pixelsWide
let height = bitmap.pixelsHigh

// Amostragem da cor de fundo (canto superior esquerdo)
let bgColor = bitmap.colorAt(x: 0, y: 0)

for y in 0..<height {
    for x in 0..<width {
        if let color = bitmap.colorAt(x: x, y: y) {
            // Calcula a diferença entre a cor do pixel e a cor de fundo
            let dr = abs(color.redComponent - bgColor!.redComponent)
            let dg = abs(color.greenComponent - bgColor!.greenComponent)
            let db = abs(color.blueComponent - bgColor!.blueComponent)
            
            // Se a cor for muito próxima do fundo, torna transparente
            if dr < 0.15 && dg < 0.15 && db < 0.15 {
                bitmap.setColor(NSColor(red: 0, green: 0, blue: 0, alpha: 0), atX: x, y: y)
            }
        }
    }
}

if let pngData = bitmap.representation(using: .png, properties: [:]) {
    do {
        try pngData.write(to: URL(fileURLWithPath: outputPath))
        print("Logo transparente salva em: \(outputPath)")
    } catch {
        print("Erro ao salvar: \(error)")
    }
}
