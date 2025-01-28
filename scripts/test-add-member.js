const axios = require('axios');

const testMember = {
    batch_code: 'TEST001',      // Required
    first_name: 'Test',         // Required
    last_name: 'User',          // Required
    internal_role: 'Member',    // Required
    discord_role_id: '987654321', // Required
    discord_id: '123456789'     // Optional
};

async function testAddMember() {
    try {
        console.log('Sending member data:', JSON.stringify(testMember, null, 2));
        const response = await axios.post('http://localhost:3000/api/members', testMember);
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        
        if (error.response?.data?.details) {
            console.error('Error details from server:', error.response.data.details);
        }
    }
}

testAddMember();
