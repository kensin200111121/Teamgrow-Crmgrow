import * as webpack from 'webpack';
import {
  CustomWebpackBrowserSchema,
  TargetOptions
} from '@angular-builders/custom-webpack';

export default (
  config: webpack.Configuration,
  options: CustomWebpackBrowserSchema,
  targetOptions: TargetOptions
) => {
  return {
    ...config,
    externals: [{ ['@redx/api-ui']: { root: '@redx/api-ui' } }]
  };
};
