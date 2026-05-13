import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsPath = path.join(__dirname, '../src/data/products.js');
const outputPath = path.join(__dirname, '../src/data/ai_prompts.js');

function generatePrompt(product) {
    const { id, name, brand, category, isNew, isRecentlyArrived } = product;
    
    let environment = "a modern, high-tech motorcycle workshop with cinematic lighting";
    if (category && (category.toLowerCase().includes('casco') || category.toLowerCase().includes('vestimenta'))) {
        environment = "a stylish urban asphalt road at sunset with bokeh city lights";
    } else if (category && (category.toLowerCase().includes('aceite') || category.toLowerCase().includes('lubricante'))) {
        environment = "a clean, minimalist studio background with fluid splashes and professional lighting";
    }

    let dynamism = "floating mechanical parts and sparks of electricity in the air";
    let statusBadge = "";
    
    if (isNew) {
        dynamism += ", with a glowing 'NUEVO' holographic badge";
        statusBadge = "4. Highlight: Add a prominent '¡NUEVO!' (NEW) sticker or ribbon.";
    } else if (isRecentlyArrived) {
        dynamism += ", with a glowing 'RECIÉN LLEGADO' holographic badge";
        statusBadge = "4. Highlight: Add a prominent '¡RECIÉN LLEGADO!' (JUST ARRIVED) sticker or ribbon.";
    }

    return `Professional advertising flyer for ${name} by ${brand}. 
    Style: High-impact 3D render, cinematic Rim Lighting, vibrant colors. 
    Product Placement: The product is centered on a premium pedestal. 
    Background: ${environment}. 
    Atmosphere: ${dynamism}. 
    Required Text to Render: 
    1. Main Title: '${name}' in bold dynamic 3D typography.
    2. Product Code: 'CÓDIGO: ${id}' in small, clean technical font near the corner or bottom.
    3. Footer: Include a professional bottom bar with 3-4 infographic icons and short labels in Spanish about quality and performance.
    ${statusBadge}
    Resolution: 8k, Unreal Engine 5 style, hyper-realistic.`;
}

try {
    const content = fs.readFileSync(productsPath, 'utf8');
    const jsonMatch = content.match(/export const products = (\[[\s\S]*?\]);/);
    
    if (jsonMatch) {
        const products = JSON.parse(jsonMatch[1]);
        const prompts = products.map(p => ({
            id: p.id,
            name: p.name,
            ai_prompt: generatePrompt(p)
        }));

        const outputContent = `export const aiPrompts = ${JSON.stringify(prompts, null, 2)};`;
        fs.writeFileSync(outputPath, outputContent);
        
        console.log(`✅ ¡Éxito! Se han generado ${prompts.length} prompts en src/data/ai_prompts.js`);
        
        console.log("\n--- Ejemplos de Prompts Generados ---");
        prompts.slice(0, 3).forEach(p => {
            console.log(`\nProducto: ${p.name}`);
            console.log(`Prompt: ${p.ai_prompt}`);
        });
    } else {
        console.error("❌ No se pudo encontrar el array de productos en products.js");
    }
} catch (error) {
    console.error("❌ Error procesando el archivo:", error.message);
}
