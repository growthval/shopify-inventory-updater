export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { productId, variantId, newPrice, inventoryItemId, locationId, stockReplenishment } = req.body;
    const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
    const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
    const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-01';

    if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_STORE) {
        return res.status(500).json({ error: 'Variables d’environnement Shopify manquantes.' });
    }

    try {
        // ✅ Mettre à jour le prix de la variante re
        const priceResponse = await fetch(`https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/variants/${variantId}.json`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
            },
            body: JSON.stringify({ variant: { id: variantId, price: newPrice } })
        });

        if (!priceResponse.ok) {
            throw new Error(`Erreur mise à jour prix: ${priceResponse.statusText}`);
        }

        const priceData = await priceResponse.json();

        // ✅ Réapprovisionner le stock
        const stockResponse = await fetch(`https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/inventory_levels/adjust.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
            },
            body: JSON.stringify({
                location_id: locationId,
                inventory_item_id: inventoryItemId,
                available_adjustment: stockReplenishment
            })
        });

        if (!stockResponse.ok) {
            throw new Error(`Erreur mise à jour stock: ${stockResponse.statusText}`);
        }

        const stockData = await stockResponse.json();

        res.json({ success: true, priceData, stockData });
    } catch (error) {
        console.error('Erreur API Shopify:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
}

