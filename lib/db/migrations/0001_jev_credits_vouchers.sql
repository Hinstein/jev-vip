CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(100) NOT NULL,
  "price_minor" integer NOT NULL,
  "currency" varchar(3) DEFAULT 'CNY' NOT NULL,
  "offerkit_campaign_key" varchar(50) NOT NULL,
  "offerkit_campaign_id" text,
  "credits" bigint NOT NULL,
  "purchase_url" text,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "products_offerkit_campaign_key_unique" UNIQUE("offerkit_campaign_key"),
  CONSTRAINT "products_offerkit_campaign_id_unique" UNIQUE("offerkit_campaign_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_credit_balances" (
  "user_id" integer PRIMARY KEY NOT NULL,
  "balance" bigint DEFAULT 0 NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "user_credit_balances_nonnegative" CHECK ("balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "product_id" integer,
  "type" varchar(30) NOT NULL,
  "amount" bigint NOT NULL,
  "source" varchar(30) NOT NULL,
  "reference_id" text NOT NULL,
  "provider_reference_id" text,
  "campaign_id" text,
  "voucher_code_hash" varchar(64),
  "voucher_code_last4" varchar(16),
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "credit_transactions_reference_id_unique" UNIQUE("reference_id"),
  CONSTRAINT "credit_transactions_amount_nonzero" CHECK ("amount" <> 0)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_credit_balances" ADD CONSTRAINT "user_credit_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
INSERT INTO "products" ("name", "price_minor", "currency", "offerkit_campaign_key", "credits", "active")
VALUES
  ('Starter', 1000, 'CNY', 'JEV_10', 1000000, true),
  ('Standard', 3000, 'CNY', 'JEV_30', 3500000, true),
  ('Pro', 5000, 'CNY', 'JEV_50', 6000000, true)
ON CONFLICT ("offerkit_campaign_key") DO NOTHING;
