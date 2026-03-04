const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// GET all
router.get("/", async (req, res) => {
  const orders = await prisma.order.findMany();
  res.json(orders);
});

// POST
router.post("/", async (req, res) => {
  const { customer, total, status } = req.body;
  const order = await prisma.order.create({
    data: { customer, total, status },
  });
  res.json(order);
});

// DELETE
router.delete("/:id", async (req, res) => {
  await prisma.order.delete({
    where: { id: Number(req.params.id) },
  });
  res.json({ message: "Deleted" });
});

module.exports = router;
