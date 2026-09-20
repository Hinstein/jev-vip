CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider_token_id" text,
	"key_hash" varchar(64) NOT NULL,
	"key_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	CONSTRAINT "api_keys_provider_token_id_unique" UNIQUE("provider_token_id"),
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"api_key_id" integer NOT NULL,
	"request_id" varchar(128) NOT NULL,
	"model" varchar(100) NOT NULL,
	"input_tokens" bigint NOT NULL,
	"output_tokens" bigint NOT NULL,
	"total_tokens" bigint NOT NULL,
	"credits" bigint NOT NULL,
	"status" varchar(32) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "user_credit_balances" ALTER COLUMN "balance" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_user_id_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_events_api_key_request_id_idx" ON "usage_events" USING btree ("api_key_id","request_id");--> statement-breakpoint
CREATE INDEX "usage_events_user_created_at_idx" ON "usage_events" USING btree ("user_id","created_at");