import { useProductStore } from './productStore';
import { SEED_PRODUCTS } from '../data/seed';

// Reset store between tests
beforeEach(() => {
  useProductStore.setState({ products: [...SEED_PRODUCTS], isLoading: false });
});

describe('productStore', () => {
  describe('addProduct', () => {
    it('adds a product to the beginning of the list', async () => {
      const initialCount = useProductStore.getState().products.length;
      await useProductStore.getState().addProduct({
        name: 'Test Product',
        description: 'Test',
        price: 999,
        sku: 'TEST-001',
        stock: 10,
        category: 'Electronics',
        tags: ['test'],
        images: [],
        status: 'active',
      }, 'seller_001');
      const { products } = useProductStore.getState();
      expect(products.length).toBe(initialCount + 1);
      expect(products[0].name).toBe('Test Product');
      expect(products[0].totalSold).toBe(0);
      expect(products[0].views).toBe(0);
    });

    it('assigns a unique id starting with prod_', async () => {
      await useProductStore.getState().addProduct({ name: 'A', description: '', price: 1, sku: 'A', stock: 1, category: 'Other', tags: [], images: [], status: 'active' }, 's1');
      const newest = useProductStore.getState().products[0];
      expect(newest.id).toMatch(/^prod_/);
      expect(newest.id).not.toBe('');
    });
  });

  describe('updateProduct', () => {
    it('updates product fields', async () => {
      const id = SEED_PRODUCTS[0].id;
      await useProductStore.getState().updateProduct(id, { name: 'Updated Name', price: 9999 });
      const product = useProductStore.getState().products.find((p) => p.id === id);
      expect(product?.name).toBe('Updated Name');
      expect(product?.price).toBe(9999);
    });

    it('does not affect other products', async () => {
      const id = SEED_PRODUCTS[0].id;
      await useProductStore.getState().updateProduct(id, { name: 'Changed' });
      const unchanged = useProductStore.getState().products.find((p) => p.id === SEED_PRODUCTS[1].id);
      expect(unchanged?.name).toBe(SEED_PRODUCTS[1].name);
    });
  });

  describe('deleteProduct', () => {
    it('removes the product', async () => {
      const id = SEED_PRODUCTS[0].id;
      await useProductStore.getState().deleteProduct(id);
      const found = useProductStore.getState().products.find((p) => p.id === id);
      expect(found).toBeUndefined();
    });

    it('does not remove other products', async () => {
      const id = SEED_PRODUCTS[0].id;
      const before = useProductStore.getState().products.length;
      await useProductStore.getState().deleteProduct(id);
      expect(useProductStore.getState().products.length).toBe(before - 1);
    });
  });

  describe('updateStatus', () => {
    it('changes product status', async () => {
      const id = SEED_PRODUCTS[0].id;
      await useProductStore.getState().updateStatus(id, 'inactive');
      expect(useProductStore.getState().products.find((p) => p.id === id)?.status).toBe('inactive');
    });
  });

  describe('updateStock', () => {
    it('sets stock to 0 and status to out_of_stock', async () => {
      const id = SEED_PRODUCTS[0].id;
      await useProductStore.getState().updateStock(id, 0);
      const product = useProductStore.getState().products.find((p) => p.id === id);
      expect(product?.stock).toBe(0);
      expect(product?.status).toBe('out_of_stock');
    });

    it('restores active status when stock goes from 0 to positive', async () => {
      const id = SEED_PRODUCTS[1].id; // prod_002 is out_of_stock with stock=0
      await useProductStore.getState().updateStock(id, 5);
      const product = useProductStore.getState().products.find((p) => p.id === id);
      expect(product?.stock).toBe(5);
      expect(product?.status).toBe('active');
    });

    it('does not change status of active product when adding stock', async () => {
      const activeProduct = SEED_PRODUCTS.find((p) => p.status === 'active' && p.stock > 0)!;
      await useProductStore.getState().updateStock(activeProduct.id, 100);
      const product = useProductStore.getState().products.find((p) => p.id === activeProduct.id);
      expect(product?.status).toBe('active');
    });
  });
});
