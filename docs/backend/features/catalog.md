# Catalog feature

CatalogModule imports ManagementModule. Public GET /api/catalog calls ManagementService.catalog and returns active product records belonging to active vendors with recorded approval. Sample products are removed. A new installation returns an empty catalog until an administrator/vendor creates and activates products.

Items include id, name, sku, description, discounted price in major INR units, currency INR, imageUrl and stock. Unit price is rounded in minor units after the percentage discount. The public projection excludes moderation reasons, business contacts, user permissions and audit details. Blocked/flagged/inactive/draft/archived products and blocked vendors' products are excluded.

The [management guide](management.md) owns the product table representation, validation, custom fields, vendor scope, moderation, collections, discounts and manual-order stock rules. Admin /products writes through /manage; storefront CatalogPage fetches /catalog and displays price, description and availability with loading/error/empty states. No cart action or checkout submission is implemented by this catalog page. Images are recorded as HTTPS URLs but the initial public view does not render them.

There is no search/pagination endpoint, configurable currency, uploaded asset storage, product variants or purchasable kit implementation. Collection IDs represent merchandising groups; they do not deplete component inventory and cannot be manually ordered.
