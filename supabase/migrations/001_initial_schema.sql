create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by text,
  delete_reason text
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null,
  category_id uuid references categories(id) on delete set null,
  image_url text,
  image_path text,
  purchase_price numeric(14, 2) not null default 0 check (purchase_price >= 0),
  sale_price numeric(14, 2) not null default 0 check (sale_price >= 0),
  quantity numeric(14, 3) not null default 0 check (quantity >= 0),
  min_quantity numeric(14, 3) not null default 0 check (min_quantity >= 0),
  note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by text,
  delete_reason text
);

create unique index if not exists products_sku_unique_lower_idx on products (lower(sku));
create index if not exists products_name_trgm_idx on products using gin (name gin_trgm_ops);
create index if not exists products_sku_trgm_idx on products using gin (sku gin_trgm_ops);
create index if not exists products_category_idx on products (category_id);
create index if not exists products_low_stock_idx on products (quantity, min_quantity) where deleted_at is null;

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  product_name text not null,
  product_sku text not null,
  quantity numeric(14, 3) not null check (quantity > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  discount numeric(14, 2) not null default 0 check (discount >= 0),
  total_amount numeric(14, 2) not null check (total_amount >= 0),
  profit numeric(14, 2) not null default 0,
  status text not null default 'completed' check (status in ('completed', 'cancelled', 'reversed', 'archived')),
  note text,
  created_at timestamptz not null default now(),
  created_by text,
  cancelled_at timestamptz,
  cancelled_by text,
  cancel_reason text
);

create index if not exists sales_product_idx on sales (product_id);
create index if not exists sales_created_at_idx on sales (created_at desc);
create index if not exists sales_status_idx on sales (status);

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  product_name text not null,
  product_sku text not null,
  quantity numeric(14, 3) not null check (quantity > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  total_amount numeric(14, 2) not null check (total_amount >= 0),
  status text not null default 'completed' check (status in ('completed', 'cancelled', 'reversed', 'archived')),
  note text,
  created_at timestamptz not null default now(),
  created_by text,
  cancelled_at timestamptz,
  cancelled_by text,
  cancel_reason text
);

create index if not exists purchases_product_idx on purchases (product_id);
create index if not exists purchases_created_at_idx on purchases (created_at desc);
create index if not exists purchases_status_idx on purchases (status);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  amount numeric(14, 2) not null check (amount > 0),
  status text not null default 'completed' check (status in ('completed', 'cancelled', 'reversed', 'archived')),
  note text,
  created_at timestamptz not null default now(),
  created_by text,
  cancelled_at timestamptz,
  cancelled_by text,
  cancel_reason text
);

create index if not exists expenses_created_at_idx on expenses (created_at desc);
create index if not exists expenses_status_idx on expenses (status);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  product_name text not null,
  product_sku text not null,
  type text not null check (type in ('initial', 'purchase', 'sale', 'manual_out', 'return', 'adjustment', 'trash_restore', 'correction')),
  quantity numeric(14, 3) not null,
  unit_price numeric(14, 2) not null default 0,
  total_amount numeric(14, 2) not null default 0,
  reason text,
  created_at timestamptz not null default now(),
  created_by text,
  related_sale_id uuid references sales(id),
  related_purchase_id uuid references purchases(id),
  old_quantity numeric(14, 3) not null,
  new_quantity numeric(14, 3) not null check (new_quantity >= 0)
);

create index if not exists stock_movements_product_idx on stock_movements (product_id);
create index if not exists stock_movements_created_at_idx on stock_movements (created_at desc);
create index if not exists stock_movements_type_idx on stock_movements (type);

create table if not exists money_movements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('sale_income', 'purchase_expense', 'manual_expense', 'correction', 'sale_cancel_reverse', 'purchase_cancel_reverse')),
  amount numeric(14, 2) not null check (amount >= 0),
  direction text not null check (direction in ('income', 'expense')),
  source_type text not null,
  source_id uuid,
  note text,
  created_at timestamptz not null default now(),
  created_by text
);

create index if not exists money_movements_created_at_idx on money_movements (created_at desc);
create index if not exists money_movements_direction_idx on money_movements (direction);
create index if not exists money_movements_source_idx on money_movements (source_type, source_id);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  note text,
  user_id text,
  ip_device text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on audit_logs (entity_type, entity_id);
create index if not exists audit_logs_action_idx on audit_logs (action);

create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on categories;
create trigger categories_set_updated_at
before update on categories
for each row execute function set_updated_at();

drop trigger if exists products_set_updated_at on products;
create trigger products_set_updated_at
before update on products
for each row execute function set_updated_at();

create or replace function prevent_important_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'important_records_are_not_physically_deleted';
end;
$$;

drop trigger if exists sales_prevent_delete on sales;
create trigger sales_prevent_delete before delete on sales
for each row execute function prevent_important_delete();

drop trigger if exists purchases_prevent_delete on purchases;
create trigger purchases_prevent_delete before delete on purchases
for each row execute function prevent_important_delete();

drop trigger if exists expenses_prevent_delete on expenses;
create trigger expenses_prevent_delete before delete on expenses
for each row execute function prevent_important_delete();

drop trigger if exists stock_movements_prevent_delete on stock_movements;
create trigger stock_movements_prevent_delete before delete on stock_movements
for each row execute function prevent_important_delete();

drop trigger if exists money_movements_prevent_delete on money_movements;
create trigger money_movements_prevent_delete before delete on money_movements
for each row execute function prevent_important_delete();

drop trigger if exists audit_logs_prevent_delete on audit_logs;
create trigger audit_logs_prevent_delete before delete on audit_logs
for each row execute function prevent_important_delete();

create or replace view v_money_balance as
select
  coalesce(sum(case when direction = 'income' then amount else 0 end), 0) as total_income,
  coalesce(sum(case when direction = 'expense' then amount else 0 end), 0) as total_expense,
  coalesce(sum(case when direction = 'income' then amount else -amount end), 0) as balance
from money_movements;

create or replace view v_inventory_snapshot as
select
  p.*,
  (p.quantity * p.purchase_price) as inventory_value,
  (p.sale_price - p.purchase_price) as estimated_profit_per_unit,
  (p.quantity <= p.min_quantity and p.min_quantity > 0) as is_low_stock
from products p
where p.deleted_at is null;

create or replace function app_create_category(
  p_name text,
  p_user_id text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category categories%rowtype;
begin
  insert into categories (name)
  values (trim(p_name))
  returning * into v_category;

  insert into audit_logs (action, entity_type, entity_id, new_value, user_id)
  values ('category_create', 'category', v_category.id, to_jsonb(v_category), p_user_id);

  return v_category.id;
exception
  when unique_violation then
    raise exception 'duplicate_category';
end;
$$;

create or replace function app_create_product(
  p_name text,
  p_sku text,
  p_category_id uuid default null,
  p_image_url text default null,
  p_image_path text default null,
  p_purchase_price numeric default 0,
  p_sale_price numeric default 0,
  p_initial_quantity numeric default 0,
  p_min_quantity numeric default 0,
  p_note text default null,
  p_is_active boolean default true,
  p_user_id text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
begin
  if p_initial_quantity < 0 then
    raise exception 'quantity_positive_required';
  end if;

  insert into products (
    name,
    sku,
    category_id,
    image_url,
    image_path,
    purchase_price,
    sale_price,
    quantity,
    min_quantity,
    note,
    is_active
  )
  values (
    trim(p_name),
    trim(p_sku),
    p_category_id,
    p_image_url,
    p_image_path,
    coalesce(p_purchase_price, 0),
    coalesce(p_sale_price, 0),
    coalesce(p_initial_quantity, 0),
    coalesce(p_min_quantity, 0),
    p_note,
    coalesce(p_is_active, true)
  )
  returning * into v_product;

  if v_product.quantity > 0 then
    insert into stock_movements (
      product_id,
      product_name,
      product_sku,
      type,
      quantity,
      unit_price,
      total_amount,
      old_quantity,
      new_quantity,
      reason,
      created_by
    )
    values (
      v_product.id,
      v_product.name,
      v_product.sku,
      'initial',
      v_product.quantity,
      v_product.purchase_price,
      v_product.quantity * v_product.purchase_price,
      0,
      v_product.quantity,
      'Boshlangich qoldiq',
      p_user_id
    );
  end if;

  insert into audit_logs (action, entity_type, entity_id, new_value, user_id)
  values ('product_create', 'product', v_product.id, to_jsonb(v_product), p_user_id);

  return v_product.id;
exception
  when unique_violation then
    raise exception 'duplicate_sku';
end;
$$;

create or replace function app_update_product(
  p_product_id uuid,
  p_name text,
  p_sku text,
  p_category_id uuid default null,
  p_image_url text default null,
  p_image_path text default null,
  p_purchase_price numeric default 0,
  p_sale_price numeric default 0,
  p_min_quantity numeric default 0,
  p_note text default null,
  p_is_active boolean default true,
  p_user_id text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old products%rowtype;
  v_product products%rowtype;
begin
  select * into v_old from products where id = p_product_id and deleted_at is null for update;

  if not found then
    raise exception 'product_not_found';
  end if;

  update products
  set
    name = trim(p_name),
    sku = trim(p_sku),
    category_id = p_category_id,
    image_url = coalesce(p_image_url, image_url),
    image_path = coalesce(p_image_path, image_path),
    purchase_price = coalesce(p_purchase_price, purchase_price),
    sale_price = coalesce(p_sale_price, sale_price),
    min_quantity = coalesce(p_min_quantity, min_quantity),
    note = p_note,
    is_active = coalesce(p_is_active, true)
  where id = p_product_id
  returning * into v_product;

  insert into audit_logs (action, entity_type, entity_id, old_value, new_value, user_id)
  values ('product_update', 'product', v_product.id, to_jsonb(v_old), to_jsonb(v_product), p_user_id);

  return v_product.id;
exception
  when unique_violation then
    raise exception 'duplicate_sku';
end;
$$;

create or replace function app_create_purchase(
  p_product_id uuid,
  p_quantity numeric,
  p_unit_price numeric,
  p_note text default null,
  p_created_by text default 'owner',
  p_created_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
  v_purchase purchases%rowtype;
  v_old_quantity numeric;
  v_new_quantity numeric;
  v_total numeric;
begin
  if p_quantity <= 0 then
    raise exception 'quantity_positive_required';
  end if;

  if p_unit_price < 0 then
    raise exception 'amount_positive_required';
  end if;

  select * into v_product from products where id = p_product_id and deleted_at is null for update;

  if not found then
    raise exception 'product_not_found';
  end if;

  v_old_quantity := v_product.quantity;
  v_new_quantity := v_old_quantity + p_quantity;
  v_total := p_quantity * p_unit_price;

  insert into purchases (
    product_id,
    product_name,
    product_sku,
    quantity,
    unit_price,
    total_amount,
    note,
    created_at,
    created_by
  )
  values (
    v_product.id,
    v_product.name,
    v_product.sku,
    p_quantity,
    p_unit_price,
    v_total,
    p_note,
    coalesce(p_created_at, now()),
    p_created_by
  )
  returning * into v_purchase;

  update products
  set quantity = v_new_quantity, purchase_price = p_unit_price
  where id = v_product.id;

  insert into stock_movements (
    product_id,
    product_name,
    product_sku,
    type,
    quantity,
    unit_price,
    total_amount,
    old_quantity,
    new_quantity,
    reason,
    created_by,
    related_purchase_id,
    created_at
  )
  values (
    v_product.id,
    v_product.name,
    v_product.sku,
    'purchase',
    p_quantity,
    p_unit_price,
    v_total,
    v_old_quantity,
    v_new_quantity,
    p_note,
    p_created_by,
    v_purchase.id,
    coalesce(p_created_at, now())
  );

  insert into money_movements (type, amount, direction, source_type, source_id, note, created_by, created_at)
  values ('purchase_expense', v_total, 'expense', 'purchase', v_purchase.id, p_note, p_created_by, coalesce(p_created_at, now()));

  insert into audit_logs (action, entity_type, entity_id, new_value, user_id)
  values ('stock_in', 'purchase', v_purchase.id, to_jsonb(v_purchase), p_created_by);

  return v_purchase.id;
end;
$$;

create or replace function app_create_sale(
  p_product_id uuid,
  p_quantity numeric,
  p_unit_price numeric default null,
  p_discount numeric default 0,
  p_note text default null,
  p_created_by text default 'owner',
  p_created_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
  v_sale sales%rowtype;
  v_old_quantity numeric;
  v_new_quantity numeric;
  v_unit_price numeric;
  v_discount numeric;
  v_total numeric;
  v_profit numeric;
begin
  if p_quantity <= 0 then
    raise exception 'quantity_positive_required';
  end if;

  select * into v_product from products where id = p_product_id and deleted_at is null for update;

  if not found then
    raise exception 'product_not_found';
  end if;

  if v_product.quantity < p_quantity then
    raise exception 'insufficient_stock';
  end if;

  v_unit_price := coalesce(p_unit_price, v_product.sale_price);
  v_discount := coalesce(p_discount, 0);
  v_total := (v_unit_price * p_quantity) - v_discount;

  if v_total < 0 then
    raise exception 'total_negative';
  end if;

  v_profit := ((v_unit_price - v_product.purchase_price) * p_quantity) - v_discount;
  v_old_quantity := v_product.quantity;
  v_new_quantity := v_old_quantity - p_quantity;

  insert into sales (
    product_id,
    product_name,
    product_sku,
    quantity,
    unit_price,
    discount,
    total_amount,
    profit,
    note,
    created_at,
    created_by
  )
  values (
    v_product.id,
    v_product.name,
    v_product.sku,
    p_quantity,
    v_unit_price,
    v_discount,
    v_total,
    v_profit,
    p_note,
    coalesce(p_created_at, now()),
    p_created_by
  )
  returning * into v_sale;

  update products set quantity = v_new_quantity where id = v_product.id;

  insert into stock_movements (
    product_id,
    product_name,
    product_sku,
    type,
    quantity,
    unit_price,
    total_amount,
    old_quantity,
    new_quantity,
    reason,
    created_by,
    related_sale_id,
    created_at
  )
  values (
    v_product.id,
    v_product.name,
    v_product.sku,
    'sale',
    p_quantity,
    v_unit_price,
    v_total,
    v_old_quantity,
    v_new_quantity,
    p_note,
    p_created_by,
    v_sale.id,
    coalesce(p_created_at, now())
  );

  insert into money_movements (type, amount, direction, source_type, source_id, note, created_by, created_at)
  values ('sale_income', v_total, 'income', 'sale', v_sale.id, p_note, p_created_by, coalesce(p_created_at, now()));

  insert into audit_logs (action, entity_type, entity_id, new_value, user_id)
  values ('sale_create', 'sale', v_sale.id, to_jsonb(v_sale), p_created_by);

  return v_sale.id;
end;
$$;

create or replace function app_cancel_sale(
  p_sale_id uuid,
  p_reason text,
  p_user_id text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale sales%rowtype;
  v_product products%rowtype;
  v_old_sale sales%rowtype;
  v_old_quantity numeric;
  v_new_quantity numeric;
begin
  select * into v_sale from sales where id = p_sale_id for update;

  if not found then
    raise exception 'sale_not_found';
  end if;

  if v_sale.status = 'cancelled' then
    raise exception 'sale_already_cancelled';
  end if;

  v_old_sale := v_sale;

  select * into v_product from products where id = v_sale.product_id for update;

  if not found then
    raise exception 'product_not_found';
  end if;

  v_old_quantity := v_product.quantity;
  v_new_quantity := v_old_quantity + v_sale.quantity;

  update sales
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = p_user_id,
      cancel_reason = p_reason
  where id = v_sale.id
  returning * into v_sale;

  update products set quantity = v_new_quantity where id = v_product.id;

  insert into stock_movements (
    product_id,
    product_name,
    product_sku,
    type,
    quantity,
    unit_price,
    total_amount,
    old_quantity,
    new_quantity,
    reason,
    created_by,
    related_sale_id
  )
  values (
    v_product.id,
    v_product.name,
    v_product.sku,
    'return',
    v_sale.quantity,
    v_sale.unit_price,
    v_sale.total_amount,
    v_old_quantity,
    v_new_quantity,
    p_reason,
    p_user_id,
    v_sale.id
  );

  insert into money_movements (type, amount, direction, source_type, source_id, note, created_by)
  values ('sale_cancel_reverse', v_sale.total_amount, 'expense', 'sale', v_sale.id, p_reason, p_user_id);

  insert into audit_logs (action, entity_type, entity_id, old_value, new_value, note, user_id)
  values ('sale_cancel', 'sale', v_sale.id, to_jsonb(v_old_sale), to_jsonb(v_sale), p_reason, p_user_id);

  return v_sale.id;
end;
$$;

create or replace function app_cancel_purchase(
  p_purchase_id uuid,
  p_reason text,
  p_user_id text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase purchases%rowtype;
  v_old_purchase purchases%rowtype;
  v_product products%rowtype;
  v_old_quantity numeric;
  v_new_quantity numeric;
begin
  select * into v_purchase from purchases where id = p_purchase_id for update;

  if not found then
    raise exception 'purchase_not_found';
  end if;

  if v_purchase.status = 'cancelled' then
    raise exception 'purchase_already_cancelled';
  end if;

  select * into v_product from products where id = v_purchase.product_id for update;

  if not found then
    raise exception 'product_not_found';
  end if;

  if v_product.quantity < v_purchase.quantity then
    raise exception 'insufficient_stock';
  end if;

  v_old_purchase := v_purchase;
  v_old_quantity := v_product.quantity;
  v_new_quantity := v_old_quantity - v_purchase.quantity;

  update purchases
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = p_user_id,
      cancel_reason = p_reason
  where id = v_purchase.id
  returning * into v_purchase;

  update products set quantity = v_new_quantity where id = v_product.id;

  insert into stock_movements (
    product_id,
    product_name,
    product_sku,
    type,
    quantity,
    unit_price,
    total_amount,
    old_quantity,
    new_quantity,
    reason,
    created_by,
    related_purchase_id
  )
  values (
    v_product.id,
    v_product.name,
    v_product.sku,
    'correction',
    v_purchase.quantity,
    v_purchase.unit_price,
    v_purchase.total_amount,
    v_old_quantity,
    v_new_quantity,
    p_reason,
    p_user_id,
    v_purchase.id
  );

  insert into money_movements (type, amount, direction, source_type, source_id, note, created_by)
  values ('purchase_cancel_reverse', v_purchase.total_amount, 'income', 'purchase', v_purchase.id, p_reason, p_user_id);

  insert into audit_logs (action, entity_type, entity_id, old_value, new_value, note, user_id)
  values ('purchase_cancel', 'purchase', v_purchase.id, to_jsonb(v_old_purchase), to_jsonb(v_purchase), p_reason, p_user_id);

  return v_purchase.id;
end;
$$;

create or replace function app_create_expense(
  p_title text,
  p_category text,
  p_amount numeric,
  p_note text default null,
  p_created_by text default 'owner',
  p_created_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expense expenses%rowtype;
begin
  if p_amount <= 0 then
    raise exception 'amount_positive_required';
  end if;

  insert into expenses (title, category, amount, note, created_by, created_at)
  values (trim(p_title), trim(p_category), p_amount, p_note, p_created_by, coalesce(p_created_at, now()))
  returning * into v_expense;

  insert into money_movements (type, amount, direction, source_type, source_id, note, created_by, created_at)
  values ('manual_expense', p_amount, 'expense', 'expense', v_expense.id, p_note, p_created_by, coalesce(p_created_at, now()));

  insert into audit_logs (action, entity_type, entity_id, new_value, user_id)
  values ('expense_create', 'expense', v_expense.id, to_jsonb(v_expense), p_created_by);

  return v_expense.id;
end;
$$;

create or replace function app_cancel_expense(
  p_expense_id uuid,
  p_reason text,
  p_user_id text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expense expenses%rowtype;
  v_old_expense expenses%rowtype;
begin
  select * into v_expense from expenses where id = p_expense_id for update;

  if not found then
    raise exception 'expense_not_found';
  end if;

  if v_expense.status = 'cancelled' then
    raise exception 'expense_already_cancelled';
  end if;

  v_old_expense := v_expense;

  update expenses
  set status = 'cancelled',
      cancelled_at = now(),
      cancelled_by = p_user_id,
      cancel_reason = p_reason
  where id = v_expense.id
  returning * into v_expense;

  insert into money_movements (type, amount, direction, source_type, source_id, note, created_by)
  values ('correction', v_expense.amount, 'income', 'expense', v_expense.id, p_reason, p_user_id);

  insert into audit_logs (action, entity_type, entity_id, old_value, new_value, note, user_id)
  values ('expense_cancel', 'expense', v_expense.id, to_jsonb(v_old_expense), to_jsonb(v_expense), p_reason, p_user_id);

  return v_expense.id;
end;
$$;

create or replace function app_manual_stock_movement(
  p_product_id uuid,
  p_type text,
  p_quantity numeric,
  p_unit_price numeric default null,
  p_reason text default null,
  p_user_id text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
  v_old_quantity numeric;
  v_new_quantity numeric;
  v_delta numeric;
  v_unit_price numeric;
  v_movement_id uuid;
begin
  if p_type not in ('manual_out', 'return', 'adjustment', 'trash_restore', 'correction') then
    raise exception 'invalid_stock_movement_type';
  end if;

  if p_type in ('manual_out', 'return', 'trash_restore') and p_quantity <= 0 then
    raise exception 'quantity_positive_required';
  end if;

  if p_type in ('adjustment', 'correction') and p_quantity = 0 then
    raise exception 'quantity_positive_required';
  end if;

  select * into v_product from products where id = p_product_id and deleted_at is null for update;

  if not found then
    raise exception 'product_not_found';
  end if;

  v_delta := case
    when p_type = 'manual_out' then -abs(p_quantity)
    when p_type in ('return', 'trash_restore') then abs(p_quantity)
    else p_quantity
  end;

  v_old_quantity := v_product.quantity;
  v_new_quantity := v_old_quantity + v_delta;

  if v_new_quantity < 0 then
    raise exception 'insufficient_stock';
  end if;

  v_unit_price := coalesce(p_unit_price, v_product.purchase_price);

  update products set quantity = v_new_quantity where id = v_product.id;

  insert into stock_movements (
    product_id,
    product_name,
    product_sku,
    type,
    quantity,
    unit_price,
    total_amount,
    old_quantity,
    new_quantity,
    reason,
    created_by
  )
  values (
    v_product.id,
    v_product.name,
    v_product.sku,
    p_type,
    p_quantity,
    v_unit_price,
    abs(p_quantity) * v_unit_price,
    v_old_quantity,
    v_new_quantity,
    p_reason,
    p_user_id
  )
  returning id into v_movement_id;

  insert into audit_logs (action, entity_type, entity_id, new_value, note, user_id)
  values (
    case when v_delta < 0 then 'stock_out' else 'stock_in' end,
    'stock_movement',
    v_movement_id,
    jsonb_build_object('old_quantity', v_old_quantity, 'new_quantity', v_new_quantity, 'type', p_type),
    p_reason,
    p_user_id
  );

  return v_movement_id;
end;
$$;

create or replace function app_soft_delete_product(
  p_product_id uuid,
  p_reason text,
  p_user_id text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old products%rowtype;
  v_product products%rowtype;
begin
  select * into v_old from products where id = p_product_id and deleted_at is null for update;

  if not found then
    raise exception 'product_not_found';
  end if;

  update products
  set deleted_at = now(),
      deleted_by = p_user_id,
      delete_reason = p_reason,
      is_active = false
  where id = p_product_id
  returning * into v_product;

  insert into audit_logs (action, entity_type, entity_id, old_value, new_value, note, user_id)
  values ('product_soft_delete', 'product', v_product.id, to_jsonb(v_old), to_jsonb(v_product), p_reason, p_user_id);

  return v_product.id;
end;
$$;

create or replace function app_restore_product(
  p_product_id uuid,
  p_user_id text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old products%rowtype;
  v_product products%rowtype;
begin
  select * into v_old from products where id = p_product_id and deleted_at is not null for update;

  if not found then
    raise exception 'product_not_found';
  end if;

  update products
  set deleted_at = null,
      deleted_by = null,
      delete_reason = null,
      is_active = true
  where id = p_product_id
  returning * into v_product;

  insert into audit_logs (action, entity_type, entity_id, old_value, new_value, user_id)
  values ('product_restore', 'product', v_product.id, to_jsonb(v_old), to_jsonb(v_product), p_user_id);

  return v_product.id;
end;
$$;

create or replace function app_soft_delete_category(
  p_category_id uuid,
  p_reason text,
  p_user_id text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old categories%rowtype;
  v_category categories%rowtype;
begin
  select * into v_old from categories where id = p_category_id and deleted_at is null for update;

  if not found then
    raise exception 'category_not_found';
  end if;

  update categories
  set deleted_at = now(),
      deleted_by = p_user_id,
      delete_reason = p_reason
  where id = p_category_id
  returning * into v_category;

  insert into audit_logs (action, entity_type, entity_id, old_value, new_value, note, user_id)
  values ('category_soft_delete', 'category', v_category.id, to_jsonb(v_old), to_jsonb(v_category), p_reason, p_user_id);

  return v_category.id;
end;
$$;

create or replace function app_restore_category(
  p_category_id uuid,
  p_user_id text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old categories%rowtype;
  v_category categories%rowtype;
begin
  select * into v_old from categories where id = p_category_id and deleted_at is not null for update;

  if not found then
    raise exception 'category_not_found';
  end if;

  update categories
  set deleted_at = null,
      deleted_by = null,
      delete_reason = null
  where id = p_category_id
  returning * into v_category;

  insert into audit_logs (action, entity_type, entity_id, old_value, new_value, user_id)
  values ('category_restore', 'category', v_category.id, to_jsonb(v_old), to_jsonb(v_category), p_user_id);

  return v_category.id;
end;
$$;

create or replace function app_permanent_delete_product(
  p_product_id uuid,
  p_user_id text default 'owner'
)
returns table(entity_type text, entity_id uuid, image_path text, outcome text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
  v_has_history boolean;
begin
  select * into v_product from products where id = p_product_id and deleted_at is not null for update;

  if not found then
    raise exception 'product_not_found';
  end if;

  select
    exists(select 1 from sales where product_id = v_product.id) or
    exists(select 1 from purchases where product_id = v_product.id) or
    exists(select 1 from stock_movements where product_id = v_product.id)
  into v_has_history;

  if v_has_history then
    insert into audit_logs (action, entity_type, entity_id, old_value, note, user_id)
    values ('product_archive_retained', 'product', v_product.id, to_jsonb(v_product), 'Tarixiy yozuvlar borligi uchun fizik ochirilmadi.', p_user_id);

    return query select 'product'::text, v_product.id, null::text, 'retained_history'::text;
    return;
  end if;

  insert into audit_logs (action, entity_type, entity_id, old_value, user_id)
  values ('product_permanent_delete', 'product', v_product.id, to_jsonb(v_product), p_user_id);

  delete from products where id = v_product.id;

  return query select 'product'::text, v_product.id, v_product.image_path, 'deleted'::text;
end;
$$;

create or replace function app_permanent_delete_category(
  p_category_id uuid,
  p_user_id text default 'owner'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category categories%rowtype;
begin
  select * into v_category from categories where id = p_category_id and deleted_at is not null for update;

  if not found then
    raise exception 'category_not_found';
  end if;

  insert into audit_logs (action, entity_type, entity_id, old_value, user_id)
  values ('category_permanent_delete', 'category', v_category.id, to_jsonb(v_category), p_user_id);

  delete from categories where id = v_category.id;

  return v_category.id;
end;
$$;

create or replace function app_purge_trash(
  p_user_id text default 'system',
  p_cutoff timestamptz default now() - interval '3 days'
)
returns table(entity_type text, entity_id uuid, image_path text, outcome text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product products%rowtype;
  v_category categories%rowtype;
  v_has_history boolean;
begin
  for v_product in
    select * from products where deleted_at is not null and deleted_at <= p_cutoff for update
  loop
    select
      exists(select 1 from sales where product_id = v_product.id) or
      exists(select 1 from purchases where product_id = v_product.id) or
      exists(select 1 from stock_movements where product_id = v_product.id)
    into v_has_history;

    if v_has_history then
      insert into audit_logs (action, entity_type, entity_id, old_value, note, user_id)
      values ('product_archive_retained', 'product', v_product.id, to_jsonb(v_product), 'Cron: tarixiy yozuvlar borligi uchun fizik ochirilmadi.', p_user_id);

      return query select 'product'::text, v_product.id, null::text, 'retained_history'::text;
    else
      insert into audit_logs (action, entity_type, entity_id, old_value, user_id)
      values ('product_permanent_delete', 'product', v_product.id, to_jsonb(v_product), p_user_id);

      delete from products where id = v_product.id;

      return query select 'product'::text, v_product.id, v_product.image_path, 'deleted'::text;
    end if;
  end loop;

  for v_category in
    select * from categories where deleted_at is not null and deleted_at <= p_cutoff for update
  loop
    insert into audit_logs (action, entity_type, entity_id, old_value, user_id)
    values ('category_permanent_delete', 'category', v_category.id, to_jsonb(v_category), p_user_id);

    delete from categories where id = v_category.id;

    return query select 'category'::text, v_category.id, null::text, 'deleted'::text;
  end loop;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    execute $storage$
      insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values (
        'product-images',
        'product-images',
        true,
        5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      )
      on conflict (id) do update
      set public = excluded.public,
          file_size_limit = excluded.file_size_limit,
          allowed_mime_types = excluded.allowed_mime_types
    $storage$;
  end if;
end $$;

alter table categories enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table purchases enable row level security;
alter table expenses enable row level security;
alter table stock_movements enable row level security;
alter table money_movements enable row level security;
alter table audit_logs enable row level security;
alter table app_settings enable row level security;
