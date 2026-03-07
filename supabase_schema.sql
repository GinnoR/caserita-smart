
-- TABLA DE USUARIOS Y SUSCRIPCIONES
CREATE TABLE users_profile (
  id UUID REFERENCES auth.users PRIMARY KEY,
  store_name TEXT NOT NULL,
  panic_word TEXT DEFAULT 'auxilio',
  subscription_status TEXT DEFAULT 'active', -- active, trial, expired
  subscription_plan TEXT DEFAULT 'premium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA DE INVENTARIO (TETRA REGISTRO)
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users_profile(id),
  product_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('Abarrotes', 'Verduras', 'Lácteos', 'Otros')),
  unit_price DECIMAL(10,2) NOT NULL,
  stock_quantity DECIMAL(10,2) DEFAULT 0,
  min_stock_alert DECIMAL(10,2) DEFAULT 5,
  expiry_date DATE, -- Campo de Caducidad
  sale_type TEXT CHECK (sale_type IN ('granel', 'empacado')) DEFAULT 'empacado',
  location_tag TEXT, -- Ubicación física
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA DE CLIENTES Y "FIADOS"
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users_profile(id),
  full_name TEXT,
  nickname_chapa TEXT, -- Identificación por "Chapa"
  phone_whatsapp TEXT,
  current_debt DECIMAL(10,2) DEFAULT 0,
  payment_due_date DATE,
  status TEXT DEFAULT 'solvent' -- solvent, debtor, loss (pérdida)
);

-- TABLA DE VENTAS Y MOVIMIENTOS
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users_profile(id),
  customer_id UUID REFERENCES customers(id),
  items JSONB NOT NULL, -- [{name, qty, price, subtotal}]
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('Efectivo', 'Yape', 'Plin', 'Tarjeta', 'Crédito')),
  is_loss BOOLEAN DEFAULT FALSE, -- Para saneamiento de cartera
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
