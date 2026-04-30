const Cart = require("../Model/cartModel");
const Product = require("../Model/productModel");

exports.addToCart = async (req, res) => {
  try {
    const userId = req.payload.id;
    const { productId, size } = req.body;

    if (!productId || !size) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const normalizedSize = size.toUpperCase();

    if (!product.sizes.includes(normalizedSize)) {
      return res.status(400).json({ message: "Invalid size" });
    }

    const stock = product.sizeStock?.[normalizedSize] || 0;

    if (stock <= 0) {
      return res.status(400).json({ message: "Out of stock" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [
          {
            product: productId,
            size: normalizedSize,
            quantity: 1,
          },
        ],
      });
    } else {
      const index = cart.items.findIndex(
        (item) =>
          item.product.toString() === productId &&
          item.size.toUpperCase() === normalizedSize
      );

      if (index > -1) {
        if (cart.items[index].quantity >= stock) {
          return res.status(400).json({ message: "Max stock reached" });
        }

        cart.items[index].quantity += 1;
      } else {
        cart.items.push({
          product: productId,
          size: normalizedSize,
          quantity: 1,
        });
      }
    }

    await cart.save();

    const updatedCart = await cart.populate({
      path: "items.product",
      select: "title thumbnail final_price_inr sizeStock",
    });

    res.status(200).json({
      message: "Added to cart",
      items: updatedCart.items,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Add to cart failed",
      error: error.message,
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const userId = req.payload.id;

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      select: "title thumbnail final_price_inr sizeStock",
    });

    if (!cart) {
      return res.status(200).json({ items: [], total: 0 });
    }

    let total = 0;

    const items = cart.items
      .map((item) => {
        const product = item.product;
        if (!product) return null;

        const size = item.size.toUpperCase();
        const price = product.final_price_inr || 0;
        const stock = product.sizeStock?.[size] || 0;

        const quantity = Math.min(item.quantity, stock);

        total += price * quantity;

        return {
          _id: item._id,
          productId: product._id,
          title: product.title,
          thumbnail: product.thumbnail,
          price,
          size,
          quantity,
          stock,
        };
      })
      .filter(Boolean);

    res.status(200).json({
      items,
      total,
    });

  } catch (error) {
    res.status(500).json({
      message: "Fetch cart failed",
      error: error.message,
    });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.payload.id;
    const { productId, size } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const normalizedSize = size.toUpperCase();

    const initialLength = cart.items.length;

    cart.items = cart.items.filter((item) => {
      return !(
        item.product.toString() === productId &&
        item.size.toUpperCase() === normalizedSize
      );
    });

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: "Item not found" });
    }

    await cart.save();

    res.status(200).json({
      message: "Item removed successfully",
      items: cart.items,
    });

  } catch (error) {
    res.status(500).json({
      message: "Remove failed",
      error: error.message,
    });
  }
};

exports.decreaseQuantity = async (req, res) => {
  try {
    const userId = req.payload.id;
    const { productId, size } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const normalizedSize = size.toUpperCase();

    const index = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.size.toUpperCase() === normalizedSize
    );

    if (index === -1) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (cart.items[index].quantity > 1) {
      cart.items[index].quantity -= 1;
    } else {
      cart.items.splice(index, 1);
    }

    await cart.save();

    const updatedCart = await cart.populate({
      path: "items.product",
      select: "title thumbnail final_price_inr sizeStock",
    });

    res.status(200).json({
      message: "Cart updated",
      items: updatedCart.items,
    });

  } catch (error) {
    res.status(500).json({
      message: "Decrease failed",
      error: error.message,
    });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.payload.id;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({ message: "Cart cleared" });

  } catch (error) {
    res.status(500).json({
      message: "Clear cart failed",
      error: error.message,
    });
  }
};