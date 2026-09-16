import ProductCard from './ProductCard';

export default function ProductGrid({ products }) {
  if (products.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 p-12 text-center text-muted">
        <p className="text-lg font-medium text-foreground">No encontramos productos</p>
        <p className="text-sm">Prueba ajustando los filtros de categoría o precio.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
