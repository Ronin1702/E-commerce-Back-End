const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  // find all products
  try {
    const productData = await Product.findAll({
      // be sure to include its associated Category and Tag data
      include: [{ model: Category }, { model: Tag }]
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get one product
router.get('/:id', async (req, res) => {
  // find a single product by its `id`
  try {
    const productData = await Product.findByPk(req.params.id, {
      // be sure to include its associated Category and Tag data
      include: [{ model: Category }, { model: Tag }]
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with that id!' });
      return;
    }

    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

// create new product
router.post('/', async (req, res) => {
  try {
    /* req.body should look like this...
      {
        product_name: "Basketball",
        price: 200.00,
        stock: 3,
        tagIds: [1, 2, 3, 4]
      }
    */
    const { product_name, price, stock, tagIds } = req.body;

    if (!product_name || !price || !stock) {
      return res.status(400).json({ message: 'Product name, price, and stock are required!' });
    }

    const product = await Product.create({ product_name, price, stock });

    if (tagIds && tagIds.length) {
      const productTagIdArr = tagIds.map((tag_id) => {
        return {
          product_id: product.id,
          tag_id,
        };
      });

      await ProductTag.bulkCreate(productTagIdArr);
    }

    res.status(200).json(product);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

// update product
router.put('/:id', async (req, res) => {
  try {
    // update product data
    const { product_name, price, stock, tagIds } = req.body;

    if (!product_name && !price && !stock && !tagIds) {
      return res.status(400).json({ message: 'No data provided for update!' });
    }

    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'No product found!' });
    }

    await product.update({ product_name, price, stock });

    if (tagIds && tagIds.length) {
      const existingProductTags = await ProductTag.findAll({ where: { product_id: req.params.id } });
      const existingTagIds = existingProductTags.map(({ tag_id }) => tag_id);

      const newProductTags = tagIds.filter((tag_id) => !existingTagIds.includes(tag_id)).map((tag_id) => {
        return {
          product_id: req.params.id,
          tag_id,
        };
      });

      await ProductTag.bulkCreate(newProductTags);

      const productTagsToRemove = existingProductTags.filter(({ tag_id }) => !tagIds.includes(tag_id)).map(({ id }) => id);
      await ProductTag.destroy({ where: { id: productTagsToRemove } });
    }

    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});


router.delete('/:id', async (req, res) => {
  // delete one product by its `id` value
  try {
    const productData = await Product.destroy({
      where: {
        id: req.params.id,
      },
    });

    if (!productData) {
      res.status(404).json({ message: 'No product found with that id!' });
      return;
    }

    res.status(200).json({ message: 'Product deleted successfully!' });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
