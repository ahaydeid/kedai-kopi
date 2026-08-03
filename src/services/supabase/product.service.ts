import { Product } from '@/core/types/product'
import { IProductService } from '@/core/interfaces/product.interface'
import { getMenuItems } from './menuService'

export class SupabaseProductService implements IProductService {
  async getAllProducts(): Promise<Product[]> {
    const menu = await getMenuItems()
    return menu.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description || '',
      price: Number(m.price),
      imageUrl: m.images && m.images.length > 0 ? m.images[0] : '/img/kedai-kopi.jpeg',
      category: m.main_category || '',
      rating: 5,
      soldCount: 10,
      stock: 100,
      isCampaign: false,
      weight: 500,
    }))
  }
}
