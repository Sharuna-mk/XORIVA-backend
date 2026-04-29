const Address = require('../Model/addressModel')
exports.createAddress = async (req, res) => {
    const userId = req.payload.id;
    const { fullName, phoneNum, address, city, pinCode } = req.body;

    try {
        if (!fullName || !phoneNum || !address || !city || !pinCode) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newAddress = new Address({
            userId,
            fullName,
            phoneNum,
            address,
            city,
            pinCode
        });

        await newAddress.save();

        res.status(201).json({
            message: "Address added successfully",
            newAddress
        });

    } catch (error) {
        res.status(500).json({ message: "server error", error });
    }
};

exports.getAddress = async (req, res) => {
    const userId = req.payload.id;

    try {
        const savedAddress = await Address.find({ userId });

        if (savedAddress.length === 0) {
            return res.status(404).json({ message: "No address found" });
        }

        res.status(200).json({
            message: "Saved addresses",
            savedAddress
        });

    } catch (error) {
        res.status(500).json({ message: "server error", error });
    }
};

exports.editAddress = async (req, res) => {
    const userId = req.payload.id;
    const addressId = req.params.id;

    const { fullName, phoneNum, address, city, pinCode } = req.body;

    try {
        const updatedAddress = await Address.findOneAndUpdate(
            { _id: addressId, userId },
            { fullName, phoneNum, address, city, pinCode },
            { new: true }
        );

        if (!updatedAddress) {
            return res.status(404).json({ message: "Address not found" });
        }

        res.status(200).json({
            message: "Address updated successfully",
            updatedAddress
        });

    } catch (error) {
        res.status(500).json({ message: "server error", error });
    }
};

exports.deleteAddress = async (req, res) => {
    const userId = req.payload.id;
    const addressId = req.params.id;

    try {
        const deletedAddress = await Address.findOneAndDelete({
            _id: addressId,
            userId
        });

        if (!deletedAddress) {
            return res.status(404).json({ message: "Address not found" });
        }

        res.status(200).json({
            message: "Address deleted successfully",
            deletedAddress
        });

    } catch (error) {
        res.status(500).json({ message: "server error", error });
    }
};