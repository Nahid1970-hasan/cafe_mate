import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { CatalogApi } from '../services/api';

const loadError = 'Unable to load data. Please try again.';

export const fetchHome = createAsyncThunk('catalog/fetchHome', async (_, { rejectWithValue }) => {
  try {
    const [categories, popular] = await Promise.all([
      CatalogApi.categories(),
      CatalogApi.products({ featured: true }),
    ]);
    return { categories: categories.data, popular: popular.data };
  } catch (_error) {
    return rejectWithValue(loadError);
  }
});

export const fetchCategoryProducts = createAsyncThunk(
  'catalog/fetchCategoryProducts',
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await CatalogApi.products({ category: categoryId });
      return response.data;
    } catch (_error) {
      return rejectWithValue(loadError);
    }
  },
);

export const searchProducts = createAsyncThunk('catalog/searchProducts', async (search, { rejectWithValue }) => {
  try {
    const response = await CatalogApi.products({ search });
    return response.data;
  } catch (_error) {
    return rejectWithValue(loadError);
  }
});

export const fetchProduct = createAsyncThunk('catalog/fetchProduct', async (productId, { rejectWithValue }) => {
  try {
    const [product, customizations] = await Promise.all([
      CatalogApi.product(productId),
      CatalogApi.customizations(productId),
    ]);
    return { product: product.data, groups: customizations.data.groups };
  } catch (_error) {
    return rejectWithValue(loadError);
  }
});

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: {
    categories: [],
    popular: [],
    categoryProducts: [],
    product: null,
    groups: [],
    homeLoading: false,
    homeError: null,
    listLoading: false,
    listError: null,
    detailLoading: false,
    detailError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHome.pending, (state) => {
        state.homeLoading = true;
        state.homeError = null;
      })
      .addCase(fetchHome.fulfilled, (state, action) => {
        state.homeLoading = false;
        state.categories = action.payload.categories;
        state.popular = action.payload.popular;
      })
      .addCase(fetchHome.rejected, (state, action) => {
        state.homeLoading = false;
        state.homeError = action.payload;
      })
      .addCase(fetchCategoryProducts.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
        state.categoryProducts = [];
      })
      .addCase(fetchCategoryProducts.fulfilled, (state, action) => {
        state.listLoading = false;
        state.categoryProducts = action.payload;
      })
      .addCase(fetchCategoryProducts.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
      })
      .addCase(fetchProduct.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
        state.product = null;
        state.groups = [];
      })
      .addCase(fetchProduct.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.product = action.payload.product;
        state.groups = action.payload.groups;
      })
      .addCase(fetchProduct.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      });
  },
});

export default catalogSlice.reducer;
