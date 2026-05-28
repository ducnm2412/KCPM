pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    parameters {
        string(name: 'EC2_HOST', defaultValue: 'your-ec2-public-ip-or-domain', description: 'Public IP or domain of the EC2 instance')
        string(name: 'EC2_USER', defaultValue: 'ubuntu', description: 'SSH user on EC2')
        string(name: 'EC2_SSH_CREDENTIALS_ID', defaultValue: 'ec2-ssh-key', description: 'Jenkins SSH private key credential ID')
        string(name: 'DEPLOY_PATH', defaultValue: '/opt/uth-confms', description: 'Backend deployment directory on EC2')
        string(name: 'FRONTEND_PATH', defaultValue: '/var/www/uth-confms', description: 'Nginx static frontend directory on EC2')
        string(name: 'SERVICE_NAME', defaultValue: 'uth-confms', description: 'systemd service name for the Spring Boot app')
    }

    environment {
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
        RELEASE_ARCHIVE = "uth-confms-${env.BUILD_NUMBER}.tar.gz"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                dir(env.BACKEND_DIR) {
                    sh 'mvn -B clean package -DskipTests'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir(env.FRONTEND_DIR) {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Package Release') {
            steps {
                sh '''
                    rm -rf release
                    mkdir -p release/backend release/frontend release/deploy
                    cp backend/target/confms-1.0.0.jar release/backend/app.jar
                    cp -R frontend/dist/. release/frontend/
                    cp deploy/ec2/deploy.sh release/deploy/deploy.sh
                    tar -czf "$RELEASE_ARCHIVE" -C release .
                '''
                archiveArtifacts artifacts: "${RELEASE_ARCHIVE}", fingerprint: true
            }
        }

        stage('Deploy To EC2') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }
            steps {
                sshagent(credentials: [params.EC2_SSH_CREDENTIALS_ID]) {
                    sh '''
                        scp -o StrictHostKeyChecking=no "$RELEASE_ARCHIVE" "$EC2_USER@$EC2_HOST:/tmp/$RELEASE_ARCHIVE"
                        ssh -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" \
                          "DEPLOY_PATH='$DEPLOY_PATH' FRONTEND_PATH='$FRONTEND_PATH' SERVICE_NAME='$SERVICE_NAME' RELEASE_ARCHIVE='/tmp/$RELEASE_ARCHIVE' bash -s" \
                          < deploy/ec2/deploy.sh
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Build completed successfully.'
        }
        failure {
            echo 'Build or deployment failed. Check the Jenkins console log.'
        }
    }
}
