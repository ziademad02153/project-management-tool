const mongoose = require('mongoose');

const uri = 'mongodb+srv://projectadmin:0215302153@cluster0.wxloo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Successfully connected to MongoDB Atlas!');
        
        // Create a simple test document
        const TestSchema = new mongoose.Schema({
            name: String,
            date: { type: Date, default: Date.now }
        });
        
        const Test = mongoose.model('Test', TestSchema);
        
        // Try to save a test document
        const testDoc = new Test({ name: 'Test Connection' });
        await testDoc.save();
        console.log('✅ Successfully saved test document!');
        
        // Clean up - delete the test document
        await Test.deleteOne({ _id: testDoc._id });
        console.log('✅ Successfully cleaned up test document!');
        
    } catch (error) {
        console.error('❌ Connection error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

testConnection();
