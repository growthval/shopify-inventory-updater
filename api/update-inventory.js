export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { productId, variantId, newPrice, inventoryItemId, locationId, stockReplenishment } = req.body;
    const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
    const SHOPIFY_STORE = process.env.SHOPIFY_STORE;

    try {
        // ✅ Mettre à jour le prix de la variante
        const priceResponse = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-01/variants/${variantId}.json`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
            },
            body: JSON.stringify({ variant: { id: variantId, price: newPrice } })
        });

        const priceData = await priceResponse.json();

        // ✅ Réapprovisionner le stock
        const stockResponse = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-01/inventory_levels/adjust.json`, {
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

        const stockData = await stockResponse.json();

        res.json({ success: true, priceData, stockData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}
