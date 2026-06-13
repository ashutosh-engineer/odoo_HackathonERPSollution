export interface InventoryStock {
  onHandQty: number;     // Actual physical stock present
  reservedQty: number;   // Stock committed to Sales Orders or Manufacturing Orders
  freeToUseQty: number;  // Dynamically calculated: onHandQty - reservedQty
}

export interface Product {
  id: string;
  sku: string;           // Machine-readable identifier
  name: string;
  category: string;
  price: number;
  stock: InventoryStock;
}

export type ModuleWorkflowState = 
  | 'Draft' 
  | 'Confirmed' 
  | 'In Progress' 
  | 'Partially Delivered' 
  | 'Fully Delivered' 
  | 'Partially Received' 
  | 'Fully Received' 
  | 'Completed' 
  | 'Cancelled';

export interface OrderLineItem {
  id: string;
  productId: string;
  quantity: number;
}
