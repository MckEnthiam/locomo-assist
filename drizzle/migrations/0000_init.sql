CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`body_part` text NOT NULL,
	`sets` integer NOT NULL,
	`reps` integer NOT NULL,
	`target_angles` text NOT NULL,
	`ref_video_path` text,
	`day_of_week` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`week_number` integer NOT NULL,
	`day_type` text,
	`total_duration` integer,
	`synced_at` integer
);
--> statement-breakpoint
CREATE TABLE `session_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`completed_at` integer,
	`sets_completed` integer DEFAULT 0 NOT NULL,
	`reps_completed` integer DEFAULT 0 NOT NULL,
	`avg_amplitude` real,
	`peak_amplitude` real,
	`compensations` text,
	`signal_data` text,
	`coach_messages` text,
	`duration_seconds` integer,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rapports` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`week_number` integer NOT NULL,
	`generated_at` integer NOT NULL,
	`pdf_path` text NOT NULL,
	`supabase_url` text,
	`summary` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rapports_session_id_unique` ON `rapports` (`session_id`);
--> statement-breakpoint
CREATE TABLE `medecin` (
	`id` text PRIMARY KEY NOT NULL,
	`nom` text,
	`prenom` text,
	`email` text,
	`telephone` text,
	`specialite` text,
	`hopital` text
);
--> statement-breakpoint
CREATE TABLE `parametres` (
	`id` text PRIMARY KEY NOT NULL,
	`langue` text DEFAULT 'fr' NOT NULL,
	`voix_coach` text DEFAULT 'fr-FR' NOT NULL,
	`vitesse_tts` real DEFAULT 1 NOT NULL,
	`coach_vocal_enabled` integer DEFAULT true NOT NULL,
	`seuil_compensation` integer DEFAULT 15 NOT NULL,
	`frequence_coach` integer DEFAULT 8 NOT NULL,
	`auto_sync` integer DEFAULT true NOT NULL,
	`nom_patient` text,
	`zone_reeducation` text DEFAULT 'epaule' NOT NULL,
	`last_sync_at` integer
);
--> statement-breakpoint
CREATE TABLE `progression` (
	`id` text PRIMARY KEY NOT NULL,
	`date` integer NOT NULL,
	`body_part` text NOT NULL,
	`angle_degrees` real NOT NULL,
	`exercise_id` text NOT NULL
);
