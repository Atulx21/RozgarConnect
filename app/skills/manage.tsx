import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Chip, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface UserSkill {
  id: string;
  skill_name: string;
  is_verified: boolean;
  jobs_completed: number;
  average_rating: number;
}

export default function ManageSkillsScreen() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const commonSkills = [
    'Tractor Driving', 'Paddy Weeding', 'Bricklaying', 'Plumbing', 
    'Electrical Work', 'Carpentry', 'Painting', 'Harvesting',
    'Irrigation', 'Pest Control', 'Cooking', 'Cleaning'
  ];

  useEffect(() => {
    if (user) {
      fetchUserSkills();
    }
  }, [user]);

  const fetchUserSkills = async () => {
    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('User skills table not found or error:', error.message);
        setSkills([]);
        setLoading(false);
        return;
      }
      setSkills(data || []);
    } catch (error) {
      console.error('Error fetching user skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async (skillName: string) => {
    if (!skillName.trim()) {
      Alert.alert('Error', 'Please enter a skill name');
      return;
    }

    // Check if skill already exists
    if (skills.some(skill => skill.skill_name.toLowerCase() === skillName.toLowerCase())) {
      Alert.alert('Error', 'You already have this skill added');
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase.from('user_skills').insert({
        user_id: user.id,
        skill_name: skillName.trim(),
        is_verified: false,
        jobs_completed: 0,
        average_rating: 0.0
      });

      if (error) throw error;

      setNewSkill('');
      fetchUserSkills();
      Alert.alert('Success', 'Skill added successfully!');
    } catch (error) {
      console.error('Error adding skill:', error);
      Alert.alert('Error', 'Failed to add skill');
    } finally {
      setAdding(false);
    }
  };

  const removeSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from('user_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;

      fetchUserSkills();
      Alert.alert('Success', 'Skill removed successfully!');
    } catch (error) {
      console.error('Error removing skill:', error);
      Alert.alert('Error', 'Failed to remove skill');
    }
  };

  const renderVerificationBadge = (skill: UserSkill) => {
    if (skill.is_verified) {
      return (
        <View style={styles.verifiedBadge}>
          <MaterialIcons name="verified" size={16} color="#4caf50" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      );
    } else if (skill.jobs_completed >= 3 && skill.average_rating >= 4.0) {
      return (
        <View style={styles.eligibleBadge}>
          <MaterialIcons name="schedule" size={16} color="#ff9800" />
          <Text style={styles.eligibleText}>Eligible for Verification</Text>
        </View>
      );
    }
    return null;
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="titleMedium">Please log in to manage skills</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button 
          mode="text" 
          onPress={() => router.back()}
          icon="arrow-left"
          style={styles.backButton}
        >
          Back
        </Button>
        <Text variant="headlineSmall" style={styles.title}>
          Manage My Skills
        </Text>
      </View>

      {/* Add New Skill */}
      <Card style={styles.addSkillCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Add New Skill
          </Text>
          
          <TextInput
            mode="outlined"
            label="Skill Name"
            value={newSkill}
            onChangeText={setNewSkill}
            style={styles.input}
            placeholder="e.g., Tractor Driving"
            right={
              <TextInput.Icon 
                icon="plus" 
                onPress={() => addSkill(newSkill)}
                disabled={adding || !newSkill.trim()}
              />
            }
          />

          <Text variant="bodyMedium" style={styles.suggestionText}>
            Common Skills:
          </Text>
          <View style={styles.commonSkills}>
            {commonSkills.map(skill => (
              <Chip
                key={skill}
                mode="outlined"
                onPress={() => addSkill(skill)}
                style={styles.skillChip}
                disabled={skills.some(s => s.skill_name === skill)}
              >
                {skill}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Current Skills */}
      <Card style={styles.skillsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            My Skills ({skills.length})
          </Text>
          <Divider style={styles.divider} />
          
          {skills.length === 0 ? (
            <View style={styles.emptySkills}>
              <MaterialIcons name="build" size={48} color="#ccc" />
              <Text variant="bodyMedium" style={styles.emptyText}>
                No skills added yet. Add your first skill above!
              </Text>
            </View>
          ) : (
            skills.map((skill) => (
              <View key={skill.id} style={styles.skillItem}>
                <View style={styles.skillHeader}>
                  <Text variant="titleMedium" style={styles.skillName}>
                    {skill.skill_name}
                  </Text>
                  <Button 
                    mode="text" 
                    onPress={() => removeSkill(skill.id)}
                    textColor="#f44336"
                    compact
                  >
                    Remove
                  </Button>
                </View>
                
                {renderVerificationBadge(skill)}
                
                <View style={styles.skillStats}>
                  <Text style={styles.statText}>
                    📊 {skill.jobs_completed} jobs completed
                  </Text>
                  {skill.average_rating > 0 && (
                    <Text style={styles.statText}>
                      ⭐ {skill.average_rating.toFixed(1)} average rating
                    </Text>
                  )}
                </View>
                
                {skill.jobs_completed >= 3 && skill.average_rating >= 4.0 && !skill.is_verified && (
                  <Text style={styles.verificationNote}>
                    💡 You're eligible for skill verification! Contact support to verify this skill.
                  </Text>
                )}
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Verification Info */}
      <Card style={styles.infoCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.infoTitle}>
            About Skill Verification
          </Text>
          <Text variant="bodyMedium" style={styles.infoText}>
            Skills become verified when you:
          </Text>
          <Text style={styles.infoPoint}>
            ✓ Complete 3+ jobs requiring that skill
          </Text>
          <Text style={styles.infoPoint}>
            ✓ Maintain a 4.0+ average rating for that skill
          </Text>
          <Text style={styles.infoPoint}>
            ✓ Get verified by an admin or employer
          </Text>
          <Text variant="bodyMedium" style={styles.infoNote}>
            Verified skills help you stand out to employers and get hired faster!
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  title: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  addSkillCard: {
    margin: 15,
    elevation: 2,
  },
  sectionTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    marginBottom: 15,
  },
  suggestionText: {
    color: '#666',
    marginBottom: 10,
  },
  commonSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    marginBottom: 8,
  },
  skillsCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  divider: {
    marginBottom: 15,
  },
  emptySkills: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
  },
  skillItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  skillName: {
    color: '#333',
    fontWeight: 'bold',
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  verifiedText: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  eligibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  eligibleText: {
    color: '#ff9800',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  skillStats: {
    gap: 4,
  },
  statText: {
    color: '#666',
    fontSize: 12,
  },
  verificationNote: {
    color: '#ff9800',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    backgroundColor: '#fff3e0',
    padding: 8,
    borderRadius: 4,
  },
  infoCard: {
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
  },
  infoTitle: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    color: '#666',
    marginBottom: 10,
  },
  infoPoint: {
    color: '#666',
    marginBottom: 4,
    paddingLeft: 10,
  },
  infoNote: {
    color: '#4caf50',
    fontStyle: 'italic',
    marginTop: 10,
    backgroundColor: '#e8f5e8',
    padding: 10,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});