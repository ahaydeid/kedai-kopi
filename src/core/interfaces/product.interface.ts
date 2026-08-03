import { Product } from '../types/product'

export interface IProductService {
  getAllProducts(): Promise<Product[]>
}
