import React from 'react';
import PricingConfigModule from './PricingConfigModule';

/**
 * EnergyTariffModule é agora um alias para o novo PricingConfigModule,
 * unificando a gestão de Tarifas de Energia e Formação de Preço Global.
 */
export default function EnergyTariffModule() {
  return <PricingConfigModule />;
}

