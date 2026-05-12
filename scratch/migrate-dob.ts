import dbConnect from '../src/lib/mongodb';
import User from '../src/models/User';

async function migrate() {
  await dbConnect();
  console.log('Connected to DB');

  const studentsWithoutDob = await User.find({ 
    role: 'Student', 
    $or: [{ dob: { $exists: false } }, { dob: null }] 
  });

  console.log(`Found ${studentsWithoutDob.length} students without DOB`);

  for (const student of studentsWithoutDob) {
    // Generate random DOB between 1995 and 2005 (Senior users)
    const year = Math.floor(Math.random() * (2005 - 1995 + 1)) + 1995;
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    const randomDob = new Date(year, month, day);

    await User.findByIdAndUpdate(student._id, { dob: randomDob });
    console.log(`Updated ${student.username} with DOB: ${randomDob.toDateString()}`);
  }

  console.log('Migration complete');
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
