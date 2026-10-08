import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

function signature(item) {
  const options = [...item.customizations]
    .map((entry) => entry.optionId)
    .sort((a, b) => a - b)
    .join(',');
  return `${item.product.id}|${options}|${(item.specialInstruction || '').trim()}`;
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], hydrated: false },
  reducers: {
    setItems(state, action) {
      state.items = action.payload;
      state.hydrated = true;
    },
    addToCart(state, action) {
      const incoming = action.payload;
      const match = state.items.find((item) => signature(item) === signature(incoming));
      if (match) {
        match.quantity = Math.min(99, match.quantity + incoming.quantity);
        return;
      }
      state.items.push(incoming);
    },
    updateCartItem(state, action) {
      const next = action.payload;
      const index = state.items.findIndex((item) => item.localId === next.localId);
      if (index < 0) {
        state.items.push(next);
        return;
      }
      const duplicate = state.items.findIndex(
        (item, itemIndex) => itemIndex !== index && signature(item) === signature(next),
      );
      if (duplicate >= 0) {
        state.items[duplicate].quantity = Math.min(99, state.items[duplicate].quantity + next.quantity);
        state.items.splice(index, 1);
        return;
      }
      state.items[index] = next;
    },
    setQuantity(state, action) {
      const item = state.items.find((entry) => entry.localId === action.payload.localId);
      if (!item) return;
      if (action.payload.quantity < 1) {
        state.items = state.items.filter((entry) => entry.localId !== item.localId);
        return;
      }
      item.quantity = Math.min(99, action.payload.quantity);
    },
    removeFromCart(state, action) {
      state.items = state.items.filter((item) => item.localId !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { setItems, addToCart, updateCartItem, setQuantity, removeFromCart, clearCart } = cartSlice.actions;

export const loadCart = () => async (dispatch) => {
  try {
    const raw = await AsyncStorage.getItem('cart');
    const items = raw ? JSON.parse(raw) : [];
    dispatch(setItems(Array.isArray(items) ? items : []));
  } catch (_error) {
    dispatch(setItems([]));
  }
};

export default cartSlice.reducer;
