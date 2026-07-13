package config

type SupabaseClient struct {
	URL       string
	AnonKey   string
	ServiceKey string
}

func NewSupabaseClient(cfg *Config) *SupabaseClient {
	return &SupabaseClient{
		URL:        cfg.SupabaseURL,
		AnonKey:    cfg.SupabaseKey,
		ServiceKey: cfg.SupabaseServiceRole,
	}
}
