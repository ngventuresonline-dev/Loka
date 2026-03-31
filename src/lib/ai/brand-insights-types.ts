/** Shape stored in brand_insights.insights (jsonb) — shared by API + UI (no server-only imports). */
export type BrandInsightsStored = {
  market_pulse: string[]
  property_recommendations: Array<{
    property_id: string
    title: string
    reasoning: string
  }>
  zone_alerts: {
    type: 'new_listing' | 'price_drop' | 'competitor_opened' | string
    headline: string
    detail: string
  }
}
